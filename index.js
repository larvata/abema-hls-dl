const {createUserDevice} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
  // getLanceIdPromise,
  getInitialPlaylistPromise,
} = require('./lib/abema');







const CustomXMLHttpRequest = require('./lib/customXMLHttpRequest');



const req = new CustomXMLHttpRequest;
console.log(req);

const keyUrl = 'abematv://v2/abema-special/AeTZsRP1RgExDM/QDuH8HVpo4861hjkQ8HoY85';
console.log('-----------------');
req.open('qET', keyUrl);
req.onload = function() {
  console.log('reqed:', req.requestText);
};

console.log('%%%%%%%%%%%%%');
req.send();









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

