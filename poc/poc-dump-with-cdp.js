const CDP = require('chrome-remote-interface');

(async () => {
  const client = await CDP();
  const {Network, Page, Runtime} = client;
  Network.requestWillBeSent((params) => {
    // console.log(params.request.url);
  });

  Network.requestIntercepted((params) => {
    const { interceptionId, request } = params;
    const continueParams = { interceptionId };
    if (request.url === 'https://api.abema.io/v1/ip/check') {
      // ignore the ip check when outside Japan
      continueParams.rawResponse = new Buffer('HTTP/1.1 200 OK\r\n\r\n').toString('base64');
    }

    Network.continueInterceptedRequest(continueParams);
  });

  Network.requestWillBeSent((params) => {
    const { requestId, request } = params;
    const { url } = request;
    if (url.endsWith('.ts')) {
      // here is all ts files
      console.log(url);
    }
  })

  await Promise.all([
    Network.enable(),
    Network.setRequestInterceptionEnabled({ enabled: true }),
    Page.enable(),
  ]);


  await Page.navigate({url: 'https://abema.tv/now-on-air/abema-special'});
  await Page.loadEventFired();

  // get current user id from localstorage
  const {result: {value: userId}} = await Runtime.evaluate({
    expression: `localStorage.getItem('abm_userId').toString();`,
    awaitPromise: true,
  });
  console.log('userId', userId);

  const abemaUri = 'abematv://v2/mahjong/Bbj74KqLbT1Kps/NB5v3Lc3DFAytXjebiW4Ph5';
  const parseAbemaProtocolCommand = `
    new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.onload = () => {
        const key = btoa(String.fromCharCode(...new Uint8Array(req.response)));
        resolve(key);
      };
      req.open('GET','${abemaUri}', '${userId}');
      req.send();
    });
  `
  const {result: {value: keyB64}} = await Runtime.evaluate({
    expression: parseAbemaProtocolCommand,
    awaitPromise: true,
  });

  // decoded aes key in base64 form
  console.log('keyB64', keyB64);

  // next steps:
  // gather all of the m3u8 and ts response data by Network.responseReceived event
  // decrypt the ts with above aes key and stream to a file
})()