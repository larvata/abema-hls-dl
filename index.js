const {createUserDevice} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  scheduleDumpPromise,
} = require('./lib/abema');

const scheduleOptions = {
  channelId: 'special-plus',
  recordDuration: 180,
  proxy: 'socks://127.0.0.1:8484',
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
    fs.writeFileSync('last_playlist.json', JSON.stringify(result, null, 2));
  })
  .catch((err) =>{
    console.log(err);
  });
