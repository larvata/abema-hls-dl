const {
  createUserDevice,
} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
  // getLanceIdPromise,
  getInitialPlaylistPromise,
} = require('./lib/abema');


// function btoa(str) {
//   var buffer;
//   if (Buffer.isBuffer(str)) {
//     buffer = str;
//   }
//   else {
//     buffer = new Buffer(str.toString(), 'binary');
//   }

//   return buffer.toString('base64');
// };

// const base64 = (e) => {
//   var t = new Uint8Array(e)
//   , n = t.byteLength;
//   if (btoa) {
//       for (var r = "", o = 0; o < n; o++)
//           r += String.fromCharCode(t[o]);
//       return btoa(r)
//   }
//   for (var i, a, s, u, l, c = "", f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", d = n % 3, h = n - d, o = 0; o < h; o += 3)
//       l = t[o] << 16 | t[o + 1] << 8 | t[o + 2],
//       i = (16515072 & l) >> 18,
//       a = (258048 & l) >> 12,
//       s = (4032 & l) >> 6,
//       u = 63 & l,
//       c += f[i] + f[a] + f[s] + f[u];
//   return 1 == d ? (l = t[h],
//   i = (252 & l) >> 2,
//   a = (3 & l) << 4,
//   c += f[i] + f[a] + "==") : 2 == d && (l = t[h] << 8 | t[h + 1],
//   i = (64512 & l) >> 10,
//   a = (1008 & l) >> 4,
//   s = (15 & l) << 2,
//   c += f[i] + f[a] + f[s] + "="),
//   c
// };




// const fs = require('fs');
// let enc = fs.readFileSync('./lib/customXMLHttpRequest.orig.js', 'utf8');
// const a = ["number","push","length","ivi(",")","slice","b16","exports","ECB","CBC","PCBC","CFB","OFB","CTR","Raw","Hex","String","isString","string","map","","split","call","s3","s2","s1","s0","left","right","p","charCodeAt","s","pow","getIV","join","0","toString","setIV","substr","d","0000000000000000","charAt","b","c","reverse","e","./s","./b","./a","123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz","./bx","./r","fromCharCode","substring","5","4","apply","./dec","prototype","localStorage","onabort","onerror","onload","onloadend","onloadstart","onreadystatechange","onprogress","ontimeout","status","statusText","timeout","readyState","response","responseText","responseBody","responseType","responseURL","responseXML","withCredentials","get","set","enumerable","configurable","defineProperty","forEach","o","requestURL","indexOf","_iurl","proxy","currentTarget","/","abm_userId","getItem","buffer","abort","setRequestHeader","getAllResponseHeaders","getResponseHeader","overrideMimeType","UNSEND","OPENED","HEADER_RECEIVED","LOADING","DONE","highOrder","lowOrder","value","binLen","novariant","variant","ush","hash","hkset","function","Cannot find module '","'"];

// a.forEach((plain, index) => {
//   enc = enc.replace(new RegExp(`a\\[${index}\\]`, 'g'), `"${plain}"`);
// });
// console.log(enc);
// fs.writeFileSync('./lib/customXMLHttpRequest.dec.org.js', enc);

// process.exit();

// var crypto = require('crypto');
// const fs = require('fs');

// const decrypted = fs.readFileSync('./test/7xPveKKA1xpyNavzppWjjj.openssl.ts');
// var key = fs.readFileSync('./test/key');
// var iv = new Buffer('accca4b41de3d9afb029070eb564be40', 'hex');
// console.log(iv.length);
// console.log(key.length);
// var cipher = crypto.createCipheriv('AES-128-CBC', key, iv);
// // cipher.setAutoPadding(false);

// var chret = cipher.update(decrypted);
// chret += cipher.final();
// fs.writeFileSync('./test/7xPveKKA1xpyNavzppWjjj.encrypted.ts', chret);

var crypto = require('crypto');
const fs = require('fs');
const encrypted = fs.readFileSync('./test/7xPveKKA1xpyNavzppWjjj.ts');
var key = fs.readFileSync('./test/key');
var key2 = new Buffer('4fff9bcab9608f67358451d845e36775', 'hex');
var iv = new Buffer('accca4b41de3d9afb029070eb564be40', 'hex');
console.log(key2, key2.length);
console.log(key, key.length);
console.log(iv, iv.length);
var decipher = crypto.createDecipheriv('AES-128-CBC', key, iv);
decipher.setAutoPadding(false);

var decret = decipher.update(encrypted);
console.log(decret.length);
// var ttt = decipher.final();
// console.log(ttt.length);
// console.log(decret);
fs.writeFileSync('./test/7xPveKKA1xpyNavzppWjjj.decrypted.ts', decret, 'binary');
console.log('encrypted length:', encrypted.length);
console.log('decrypted length: ',decret.length);
process.exit();


// const CryptoJS = require('crypto-js');
// const hexKey = fs.readFileSync('./test/key').toString('hex');
// const key = CryptoJS.enc.Hex.parse(hexKey);
// const encryptedHex = fs.readFileSync('./test/7xPveKKA1xpyNavzppWjjj.ts', 'ascii');
// // const encrypted = encryptedHex;
// const encrypted = CryptoJS.enc.Hex.parse(encryptedHex);
// console.log('source length:',encryptedHex.length);
// decryptOptions = {
//   iv: CryptoJS.enc.Hex.parse('accca4b41de3d9afb029070eb564be40'),
//   // padding: CryptoJS.pad.Pkcs7,
//   // mode: CryptoJS.mode.CBC
// }
// console.log(decryptOptions);
// var decrypted = CryptoJS.AES.decrypt(encrypted, key, decryptOptions);
// console.log('result sigBytes:', decrypted.sigBytes);
// fs.writeFileSync('./test/7xPveKKA1xpyNavzppWjjj.decrypted.ts', decrypted, 'hex');
// process.exit();

// POC of decrypt key from abema url
const CustomXMLHttpRequest = require('./lib/customXMLHttpRequest.dec');

const req = new CustomXMLHttpRequest;

// T/+byrlgj2c1hFHYReNndQ==
const abm_userId = '8cwumFwcnBrDmq';
const keyUrl = 'abematv://v2/abema-news/abema-news/BebTWhpWdqVpc8KBQHT3UE5';
console.log('-----------------');
// req.open('qET', keyUrl);
req.onload = function() {
  const key = new Buffer(req.response);
  const hex = new Buffer(req.response).toString('hex');
  const b64 = new Buffer(req.response).toString('base64');
  require('fs').writeFileSync('./test/key', key);
  console.log('hex:', hex);
  console.log('base64:', b64);
};

console.log('%%%%%%%%%%%%%');
req.send(keyUrl, abm_userId);

process.exit();








const deviceInfo = createUserDevice();
console.log(deviceInfo);

const dateRange = {
  dateFrom: '20170317',
  dateTo: '20170317',
};

const {deviceId, applicationKeySecret} = deviceInfo;
registUserDevicePromise(deviceId, applicationKeySecret)
  .then(getUserDetailsPromise)
  .then(getMediaTokenPromise)
  .then(getMediaDetailsPromise.bind(null, dateRange))
  // .then(getLanceId)
  .then(getInitialPlaylistPromise.bind(null, 'abema-news'))
  .then((result) => {
    console.log('final result:', result);
    // require('fs').writeFileSync('channel.json', JSON.stringify(result, null, 2));
  })
  .catch((err) =>{
    console.log(err);
  });

