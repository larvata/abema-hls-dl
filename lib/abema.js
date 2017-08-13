process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const {
  DEFAULT_TIMEOUT,
  RETRY_INTERVAL,
  PLAYLIST_FETCH_INTERVAL,
  TS_DUMP_CACHE_PATH,
  TS_DOWNLOAD_PATH,
  DOMAINS,
} = require('./constants');

const fs = require('fs');
const crypto = require('crypto');
const leftPad = require('left-pad');
const m3u8 = require('m3u8-parser');
const moment = require('moment');

const request = require('superagent');
require('superagent-proxy')(request);

// add a feature that proxy() can accept an invalid proxy url
request.Request.prototype._proxy = request.Request.prototype.proxy;
request.Request.prototype.proxy = function(proxyUrl) {
  if (proxyUrl) {
    return this._proxy(proxyUrl);
  }
  return this;
};

const {
  getMediaToken,
  getChannelPlaylist,
  decodeAbemaURIPromise,
} = require('./utils');


const SessionManager = require('./SessionManager');
const session = new SessionManager({
  agent: request.agent(),
  mediaToken: getMediaToken(),
});

const fileStreamWritePromise = (fstream, data) => {
  return new Promise((resolve, reject) => {
    fstream.write(data, ()=>{
      return resolve();
    });
  });
};

const setTimeoutPromise = (timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(()=>{
      return resolve();
    }, timeout);
  });
};

const _updateUserInfo = (userInfo) => {
  const {token, profile} = userInfo;
  session.userToken = token;
  session.profile = profile;
  return Promise.resolve(userInfo);
};

const _updateMediaToken = (mediaToken) => {
  const {token} = mediaToken;
  session.mediaToken = token;
  return Promise.resolve(mediaToken);
};

const responseJSONHandler = (res) => {
  if (res.status !== 200) {
    return Promise.reject(`parse JSON failed: ${res.text}`);
  }
  else {
    return Promise.resolve(res.body);
  }
};

const responseM3U8Handler = (res) => {
  if (res.status !== 200) {
    return Promise.reject(`failed to get response: ${res.text}`);
  }
  else {
    const parser = new m3u8.Parser();
    parser.push(res.text);
    parser.end();
    const result = parser.manifest;
    return Promise.resolve(result);
  }
};

const createRequest = (endpoint, method, payload) => {
  const isFullUrl = /^http/.test(endpoint);
  const url = isFullUrl ? endpoint : `${DOMAINS.api}/${endpoint}`;

  let baseRequest = session.agent;
  if (method === 'GET') {
    baseRequest = session.agent.get(url).query(payload);
  }
  else if(method = 'POST') {
    baseRequest = session.agent.post(url).send(payload);
  }
  else if(method === 'OPTIONS') {
    baseRequest = session.agent.options(url);
  }
  else {
    return Promise.reject(`Unknown http method: ${method}`);
  }

  const {userToken} = session;
  if (userToken) {
    // if userToken available set to the request
    baseRequest.set('authorization', `bearer ${userToken}`);
  }

  baseRequest.proxy(session.proxy).timeout(DEFAULT_TIMEOUT);
  return baseRequest;
};

const setProxy = (proxyUrl) => {
  session.setProxy(proxyUrl);
}

const registUserDevicePromise = (deviceId, applicationKeySecret) => {
  const url = 'v1/users';
  const method = 'POST';
  const payload = {
    deviceId,
    applicationKeySecret,
  };

  const request = createRequest(url, method, payload)
    .then(responseJSONHandler)
    .then(_updateUserInfo);
  return request;
};

const getUserDetailsPromise = () => {
  const {profile} = session;
  const url = `v1/users/${profile.userId}`;
  const method = 'GET';

  const request = createRequest(url, method)
    .then(responseJSONHandler);
  return request;
};

const getMediaTokenPromise = () => {
  const url = 'v1/media/token';
  const method = 'GET';

  const payload = session.mediaToken;

  const request = createRequest(url, method, payload)
    .then(responseJSONHandler)
    .then(_updateMediaToken);
  return request;
};

const getMediaDetailsPromise = (dateRange) => {
  const url = 'v1/media';
  const method = 'GET';

  // for now hardcode the daterange,
  // maybe user should can set this value in the next version
  dateRange = {
    dateFrom: moment().format('YYYYMMDD'),
    dateTo: moment().add(1, 'day').format('YYYYMMDD'),
  }

  const payload = dateRange;

  const request = createRequest(url, method, payload)
    .then(responseJSONHandler);
  return request;
};

// it will return a ts data buffer
const downloadTSFilePromise = (url) => {
  return new Promise((resolve, reject) => {
    request.get(url)
    .proxy(session.proxy)
    .timeout(DEFAULT_TIMEOUT)
    .buffer(true)
    .then((resp) => {
      // session.feedCacheDuration(duration);
      // const waitNaturallyTimeout = session.getCacheWaitTime();
      // if (waitNaturallyTimeout > 0) {
      //   console.log(`wait ${waitNaturallyTimeout}ms and try fetch next segment`);
      // }
      // return setTimeoutPromise(waitNaturallyTimeout).then(()=>{resolve(resp.body)});
      console.log(`ts done: ${url} (${session.getCacheDuration()})`);

      resolve(resp.body);
    })
    .catch((error) => {
      console.log(error.message);
      return setTimeoutPromise(RETRY_INTERVAL).then(()=>{
        return downloadTSFilePromise(url).then((body)=>{
          return resolve(body);
        });
      });
    });
  });
};

const downloadAndDecryptPromise = (fstream, options) => {
  if (!session.isRecording && session.segmentList.every((s) => s.done)) {
    // stop recording when time end and no pendding tasks
    fstream.end();
    return Promise.resolve(session.segmentList);
  }
  // get first undone segment
  const segment = session.segmentList.find(s => !s.done);
  if (!segment) {
    // no more unfinished segment, wait 3 second and try again
    return setTimeoutPromise(RETRY_INTERVAL).then(()=>{
      return downloadAndDecryptPromise(fstream, options);
    });
  }

  const duration = parseInt(segment.duration * 1000);

  if (!segment.key) {
    session.feedCacheDuration(duration);
    // it is an ad, so skip it and start to the next segment
    segment.done = true;
    const waitNaturallyTimeout = session.getCacheWaitTime();
    if (waitNaturallyTimeout > 0) {
      console.log(`skip ad, wait ${waitNaturallyTimeout}ms to flush the cache.`);
    }
    return setTimeoutPromise(waitNaturallyTimeout).then(() => {
      return downloadAndDecryptPromise(fstream, options);
    });
  }

  const keyUri = segment.key.uri;
  let ivHex = segment.key.iv.reduce((a, b)=>{
    const hexB = leftPad(b.toString(16), 8, '0');
    return (a+hexB);
  }, '');
  const ivBuffer= new Buffer(ivHex, 'hex');
  return decodeAbemaURIPromise(keyUri, session.profile.userId).then((keyBuffer) => {
    // const duration = parseInt(segment.duration * 1000);
    return downloadTSFilePromise(segment.uri).then((tsBuffer)=>{
      const {saveCacheFile, recordingKey} = options;
      if (saveCacheFile) {
        // extract ts file name from url
        const urlParts = segment.uri.split('/');
        const tsFileName = urlParts.pop();
        fs.writeFileSync(`${TS_DUMP_CACHE_PATH}/${recordingKey}/${tsFileName}`, tsBuffer);
      }

      return Promise.resolve({
        tsBuffer,
        keyBuffer,
        ivBuffer,
        encrypted: true,
      });
    });
  }).then((lastResult) =>{
    const {keyBuffer, tsBuffer, ivBuffer} = lastResult;
    // begin decrypt
    const decipher = crypto.createDecipheriv('AES-128-CBC', keyBuffer, ivBuffer);
    const decrypted = Buffer.concat([decipher.update(tsBuffer), decipher.final()]);

    return fileStreamWritePromise(fstream, decrypted);
  })
  .then(() => {
    segment.done = true;
    session.feedCacheDuration(duration);
    const waitNaturallyTimeout = session.getCacheWaitTime();
    if (waitNaturallyTimeout > 0) {
      console.log(`wait ${waitNaturallyTimeout}ms and try fetch next segment`);
    }
    return setTimeoutPromise(waitNaturallyTimeout).then(() => {
      return downloadAndDecryptPromise(fstream, options);
    });
  });
};

const downloadTSSegmentListPromies = (m3u8Url) => {
  return session.agent.get(m3u8Url)
    .buffer(true)
    .proxy(session.proxy)
    .timeout(DEFAULT_TIMEOUT)
    .then(responseM3U8Handler)
    .then((pl) => {
      return Promise.resolve(pl);
    })
    .catch((e) => {
      console.log(e.message);
      console.log('retry m3u8 playlist.');
      return setTimeoutPromise(RETRY_INTERVAL).then(()=>downloadTSSegmentListPromies(m3u8Url)).then((pl) => {
        return Promise.resolve(pl);
      });
    });
  };

const downloadInitialPlaylistPromise = (channelId) => {
  const {mediaToken} = session;
  const pl = getChannelPlaylist(channelId, mediaToken, null, 'home');
  const request = session.agent.get(pl.playlist)
    .buffer(true)
    .proxy(session.proxy)
    .timeout(DEFAULT_TIMEOUT)
    .then(responseM3U8Handler)
    .then((plOfpl) => {
      // playlist of a playlist
      // get the best quality from it
      const best = plOfpl.playlists.reduce((a, b) => {
        if (!a) {
          return b;
        }

        if (a.attributes.BANDWIDTH < b.attributes.BANDWIDTH) {
          return b;
        }
        return a;
      });

      const url = `${pl.baseUrl}/${best.uri}`;
      return downloadTSSegmentListPromies(url);
    })
    .catch((e) => {
      console.log(e.message);
      console.log('retry ts playlist.');
      return setTimeoutPromise(RETRY_INTERVAL)
        .then(()=> downloadInitialPlaylistPromise(channelId))
        .then((pl) => {
          return Promise.resolve(pl);
      });
    });

  return request;
};


const _feedStreamList = (segments) => {
  const {segmentList} = session;
  if (segmentList.length === 0) {
    // fresh list just feed current entities
    segments.forEach(s => segmentList.push(s));
    return;
  }

  // not empty list, add the segments not in the list
  const lastSeg = segmentList[segmentList.length - 1];
  const startIndex = segments.findIndex(s=> s.uri === lastSeg.uri);
  if (startIndex === -1) {
    // all of the sements are not in current list
    // just append
    segments.forEach(s => segmentList.push(s));
  }
  else {
    const newSegs = segments.slice(startIndex + 1);
    newSegs.forEach(s => segmentList.push(s));
  }
};

const dumpStreamPromise = (channelId, recordingKey) => {
  if (!session.shouldContinueRecord()) {
    console.log('all of the ts segments info are fetched.\ if the download has not been finished please wait patiently.');
    session.isRecording = false;
    fs.writeFileSync(
      `${TS_DUMP_CACHE_PATH}/${recordingKey}/playlist.json`,
      JSON.stringify(session.segmentList, null, 2));

    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    downloadInitialPlaylistPromise(channelId)
      .then((playlist) => {
        _feedStreamList(playlist.segments);
        // console.log('unresolved segemnt pool:', session.segmentList.filter((s) => !s.done).length);
        return setTimeoutPromise(PLAYLIST_FETCH_INTERVAL);
      })
      .then(() => {
        return dumpStreamPromise(channelId, recordingKey);
      })
      .then(()=>{
        return resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const scheduleDumpPromise = (options) => {
    console.log(options);
    const {
      recordStart,
      recordDuration,
      channelId,
      // proxy,
      saveCacheFile,
    } = options;

    const currentTime = new Date().getTime();
    const scheduledTime = recordStart.getTime();
    const scheduledTimeEnd = scheduledTime + 60 * recordDuration * 1000;

    const scheduledTimeString = moment().format('YYYYMMDD-HHmmSS');

    const recordingKey = `${channelId}-${scheduledTimeString}-${recordDuration}`;
    const tsFileStream = fs.createWriteStream(`./${TS_DOWNLOAD_PATH}/${recordingKey}.ts`);

    // prepare folder for save cache files
    fs.mkdirSync(`${TS_DUMP_CACHE_PATH}/${recordingKey}`);

    // tsFileStream.on('finish', ()=>{
    //   console.log('file stream was finished.');
    // });

    console.log('Begin a schedule for recording.');
    const waitSeconds = (scheduledTime - currentTime) * 1000;
    setTimeout(()=>{
      return dumpStreamPromise(channelId, recordingKey);
    }, waitSeconds);

    // session.setProxy(proxy);
    session.recordingStart(scheduledTimeEnd);

    return downloadAndDecryptPromise(tsFileStream, {
      saveCacheFile,
      recordingKey,
    });
};


// init, create output dirs
try {
  fs.mkdirSync(TS_DUMP_CACHE_PATH);
}
catch(e) {}

try{
  fs.mkdirSync(TS_DOWNLOAD_PATH);
}
catch(e) {}

module.exports = {
  registUserDevicePromise,
  getUserDetailsPromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
  scheduleDumpPromise,
  setProxy,
};
