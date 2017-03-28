process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const crypto = require('crypto');
const leftPad = require('left-pad');
const request = require('superagent');
require('superagent-proxy')(request);

const m3u8 = require('m3u8-parser');

const {
  getMediaToken,
  getChannelPlaylist,
  decodeAbemaURIPromise,
} = require('./utils');
const baseUrl = 'https://api.abema.io/';

// const proxy = 'http://127.0.0.1:8888';
const proxy = 'socks://127.0.0.1:8484';

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

// init the agent to clear the cookies jar
const initSession = () => {
  const session = {
    // use agent for cookie supply
    agent: request.agent(),
    userToken: null,
    userId: null,
    mediaToken: getMediaToken(),
    segmentList: [],
    recording: false,
  };
  return session;
};

let session = initSession();

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
  const url = isFullUrl ? endpoint : `${baseUrl}${endpoint}`;

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

  baseRequest.proxy(proxy);
  return baseRequest;
};


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

  const payload = dateRange;

  const request = createRequest(url, method, payload)
    .then(responseJSONHandler);
  return request;
};

// it will return a ts data buffer
const downloadTSFilePromise = (url) => {
  console.log('fetch ts file', url);
  return request.get(url)
    .proxy(proxy)
    .buffer(true);
};

const downloadAndDecryptPromise = (fstream) => {
  if (!session.recording && session.segmentList.every((s) => s.done)) {
    // stop recording when time end and no pendding tasks
    fstream.end();
    return Promise.resolve(session.segmentList.map(s=>s.uri));
  }
  // get first undone segment
  const segment = session.segmentList.find(s => !s.done);
  if (segment) {
  }
  else {
    return setTimeoutPromise(3000).then(()=>{
      return downloadAndDecryptPromise(fstream);
    });
  }

  let tsDecryptPromise = null;
  if (!segment.key) {
    console.log('ad: ', JSON.stringify(segment, null, 2));
    // tsDecryptPromise = downloadTSFilePromise(segment.uri).then((resp)=>{
    //   return Promise.resolve({
    //     tsBuffer: resp.body,
    //   });
    // });
    // it is a ad skip to writing to the ts file
    return Promise.resolve();
  }
  else {
    const keyUri = segment.key.uri;
    let ivHex = segment.key.iv.reduce((a, b)=>{
      const hexB = leftPad(b.toString(16), 8, '0');
      return (a+hexB);
    }, '');
    const ivBuffer= new Buffer(ivHex, 'hex');
    tsDecryptPromise = decodeAbemaURIPromise(keyUri, session.profile.userId).then((keyBuffer) => {
      return downloadTSFilePromise(segment.uri).then((resp)=>{
        return Promise.resolve({
          tsBuffer: resp.body,
          keyBuffer,
          ivBuffer,
          encrypted: true,
        });
      });
    })
  }

  return tsDecryptPromise.then((lastResult) =>{
    const {keyBuffer, tsBuffer, ivBuffer} = lastResult;

    let outputBuffer = tsBuffer;
    // begin decrypt
    const decipher = crypto.createDecipheriv('AES-128-CBC', keyBuffer, ivBuffer);
    const decrypted = outputBuffer = decipher.update(tsBuffer);

    return fileStreamWritePromise(fstream, decrypted);
  })
  .then(() => {
    segment.done = true;
    return downloadAndDecryptPromise(fstream);
  });
};

const getInitialPlaylistPromise = (channelId) => {
  const {mediaToken} = session;
  const pl = getChannelPlaylist(channelId, mediaToken, null, 'home');
  const request = session.agent.get(pl.playlist)
    .buffer(true)
    .proxy(proxy)
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
      return session.agent.get(url)
        .buffer(true)
        .proxy(proxy)
        .then(responseM3U8Handler)
        .then((pl) => {
          require('fs').writeFileSync('ooo.m3u8', JSON.stringify(pl, null, 2));
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

const shouldContinueRecord = (scheduledTimeEnd) => {
  const currentTime = new Date().getTime();
  return currentTime < scheduledTimeEnd;
}

const dumpStreamPromise = (channelId, scheduledTimeEnd) => {
  if (!shouldContinueRecord(scheduledTimeEnd)) {
    console.log('Stop recording.');
    session.recording = false;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    getInitialPlaylistPromise(channelId)
      .then((playlist) => {
        _feedStreamList(playlist.segments);
        return setTimeoutPromise(5000);
      })
      .then(() => {
        return dumpStreamPromise(channelId, scheduledTimeEnd);
      })
      .then(()=>{
        console.log('all of the ts segments info are fetched.\ if the download has not been finished please wait patiently.');
        return Promise.resolve();
      });
  })
}


const scheduleDumpPromise = (options) => {
    console.log(options);
    const { recordStart, recordDuration, channelId } = options;
    const currentTime = new Date().getTime();
    const scheduledTime = recordStart.getTime();
    const scheduledTimeEnd = scheduledTime + 60 * recordDuration * 1000;

    const scheduledTimeString = `${recordStart.getFullYear()}${recordStart.getMonth()+1}${recordStart.getDate()}-${recordStart.getHours()}${recordStart.getMinutes()}${recordStart.getSeconds()}`;
    // todo code for validate the options
    // ...
    session.recording = true;
    const tsFileStream = fs.createWriteStream(`./test/${channelId}-${scheduledTimeString}.ts`);

    tsFileStream.on('finish', ()=>{
      console.log('file stream finish');
    });

    console.log('Begin a schedule for recording.');
    const waitSeconds = (scheduledTime - currentTime) * 1000;
    setTimeout(()=>{
      return dumpStreamPromise(channelId, scheduledTimeEnd);
    }, waitSeconds);

    return downloadAndDecryptPromise(tsFileStream);
}

module.exports = {
  initSession,
  registUserDevicePromise,
  getUserDetailsPromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
  scheduleDumpPromise,
};
