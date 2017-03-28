const {createUserDevice} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  scheduleDumpPromise,
} = require('./lib/abema');

const scheduleOptions = {
  channelId: 'abema-news',
  recordDuration: 1,
};
const d = new Date();
scheduleOptions.recordStart = d;

const deviceInfo = createUserDevice();
const {deviceId, applicationKeySecret} = deviceInfo;
registUserDevicePromise(deviceId, applicationKeySecret)
  .then(getUserDetailsPromise)
  .then(getMediaTokenPromise)
  .then(scheduleDumpPromise.bind(null, scheduleOptions))
  .then((result) => {
    console.log('final result:', result);
  })
  .catch((err) =>{
    console.log(err);
  });
