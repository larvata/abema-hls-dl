const {createUserDevice} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  getMediaDetailsPromise,
} = require('./lib/abema');

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
  .then((result) => {
    console.log('final result:', result);
  })
  .catch((err) =>{
    console.log(err);
  });

