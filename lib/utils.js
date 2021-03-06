const CryptoJS = require('crypto-js');
const CustomXMLHttpRequest = require('./customXMLHttpRequest.dec');
const {URL} = require('./constants');

const getRequiredTime = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(0);
  d.setSeconds(0);
  return d;
};

const getnerateUUID = () => {
  let n = '';
  for (let e, r = 0; r < 32; r++)
      e = 16 * Math.random() | 0,
      r > 4 && r < 21 && !(r % 4) && (n += '-'),
      n += (12 === r ? 4 : 16 === r ? 3 & e | 8 : e).toString(16);
  return n;
};

const generateApplicationKeySecret = (guid, currentTime) => {
  const seed = 'v+Gjs=25Aw5erR!J8ZuvRrCx*rGswhB&qdHd_SYerEWdU&a?3DzN9BRbp5KwY4hEmcj5#fykMjJ=AuWz5GSMY-d@H7DMEh3M@9n2G552Us$$k9cD=3TxwWe86!x#Zyhe';
  const algo = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, seed);

  const foo = (e) => {
    const t = CryptoJS.enc.Base64.stringify(e.finalize());
    return t.split('=').join('').split('+').join('-').split('/').join('_');
  };

  const bar = (e) => {
    return Math.floor(e.getTime() / 1000);
  };

  algo.update(seed);

  for(let i = 0; i < (currentTime.getUTCMonth() + 1); i++) {
    const l = algo.finalize();
    algo.reset();
    algo.update(l);
  }

  const sir = foo(algo);
  algo.reset();
  algo.update(sir + guid);


  for(let i = 0, m = (currentTime.getUTCDate() % 5); i < m; i++) {
    const l = algo.finalize();
    algo.reset();
    algo.update(l);
  }

  const sir2 = foo(algo);
  algo.reset();
  algo.update(sir2 + bar(currentTime));

  for (let i =0, m = (currentTime.getUTCHours() % 5); i < m; i++) {
    const l = algo.finalize();
    algo.reset();
    algo.update(l);
  }

  const result = foo(algo);
  return result;
};

const createUserDevice = () => {
  const deviceId = getnerateUUID();
  const date = getRequiredTime();
  const applicationKeySecret = generateApplicationKeySecret(deviceId, date);
  return {
    deviceId,
    applicationKeySecret,
  };
};

const getMediaToken = () => {
  return {
    osName: 'pc',
    osVersion: '1.0.0',
    osLang: 'en-US',
    osTimezone: 'Asia/Shanghai',
    appVersion: 'v2.2.0',
  };
};


// e is an immutable object
// lanceId may be not necessary
const getChannelPlaylist = (channelId, mediaToken, mediaQuality, requestFrom, lanceId) => {
  // get the value from cookie
  // const lanceId = Cookie.P;

  const queryObjects = [
    mediaToken && `t=${mediaToken}`,
    mediaQuality && `mq=${mediaQuality}`,
    requestFrom && `frm=${requestFrom}`,
    // lanceId && `lanceId=${lanceId}`,
  ].filter((q) => q);

  const queryString = queryObjects.join('&');

  const baseUrl = `${URL.channel_play}/${channelId}`;
  const playlist = `${baseUrl}/playlist.m3u8?${queryString}`;
  // the enc is the drm module
  const playlist_dash = `${baseUrl}/manifest.mpd?${queryString}&dt=pc_chrome&enc=wv&scope=`;
  return {
    playlist,
    playlist_dash,
    baseUrl,
  };
};

// it will response the key buffer
const decodeAbemaURIPromise = (uri, uid) => {
  return new Promise((resolve, reject) => {
    const req = new CustomXMLHttpRequest;
    req.onload = () => {
      const key = new Buffer(req.response);
      resolve(key);
    };
    req.send(uri, uid);
  });
};


module.exports = {
  createUserDevice,
  getMediaToken,
  getChannelPlaylist,
  decodeAbemaURIPromise,
};
