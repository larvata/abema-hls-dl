const request = require('superagent');
require('superagent-proxy')(request);

const m3u8 = require('m3u8-parser');

const {
  getMediaToken,
  getChannelPlaylist,
} = require('./utils');
const baseUrl = 'https://api.abema.io/';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const proxy = 'http://127.0.0.1:8888';
// 'pragma: no-cache' -H 'origin: https://abema.tv' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.8,ja;q=0.6' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3004.3 Safari/537.36' -H 'content-type: application/json' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: api.abema.io' -H 'referer: https://abema.tv/'

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
    agent: request.agent(),
    userToken: null,
    userId: null,
    mediaToken: getMediaToken(),
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

// const responseTextHandler = (res) => {
//   if (res.status !== 200) {
//     return Promise.reject(`failed to get response: ${res.text}`);
//   }
//   else {
//     return Promise.resolve(res.text);
//   }
// };

const responseM3U8Handler = (res) => {
  if (res.status !== 200) {
    return Promise.reject(`failed to get response: ${res.text}`);
  }
  else {
    const parser = new m3u8.Parser();
    parser.push(res.text);
    require('fs').writeFileSync('qqq.m3u8', res.text);
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

// const getLanceIdPromise = () =>{
//   const url = 'https://sy.ameblo.jp/sync/';
//   const method = 'GET';
//   const payload = {
//     org: 'sy.abema.tv',
//   };

//   const result = createRequest(url, method, payload)
//     .then(responseJSONHandler)
//     // .then((res) => {
//     //   if (res.status !== 200) {

//     //   }
//     // })
// };

getInitialPlaylistPromise = (channelId) => {
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

module.exports = {
  initSession,
  registUserDevicePromise,
  getUserDetailsPromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
  // getLanceIdPromise,
  getInitialPlaylistPromise,
};
