const CryptoJS = require('crypto-js');

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

let deviceId = '804040e0-f1bd-412e-a20d-536a78e6a94d';
let d = new Date(1489654800891);
deviceId = getnerateUUID();
d = getRequiredTime();
const applicationKeySecret = generateApplicationKeySecret(deviceId, d);
console.log('deviceId:', deviceId);
console.log('applicationKeySecret:', applicationKeySecret);

const curlTemplate = `curl 'https://api.abema.io/v1/users' -H 'pragma: no-cache' -H 'origin: https://abema.tv' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.8,ja;q=0.6' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3004.3 Safari/537.36' -H 'content-type: application/json' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: api.abema.io' -H 'referer: https://abema.tv/' --data-binary '{"deviceId":"${deviceId}","applicationKeySecret":"${applicationKeySecret}"}' --compressed`;
console.log(curlTemplate);
