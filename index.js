const program = require('commander');
const pkg = require('./package');
const {createUserDevice} = require('./lib/utils');
const {
  getUserDetailsPromise,
  registUserDevicePromise,
  getMediaTokenPromise,
  scheduleDumpPromise,
  getMediaDetailsPromise,
  setProxy,
} = require('./lib/abema');

program
  .version(pkg.version)
  .option('-l, --list', 'list all of the available channels')
  .option('-c, --channel <channelId>', 'channel id for recording, default: abema-news')
  .option('-d, --duration <duration>', 'recording duration(minute) default: 30')
  .option('-p, --proxy <proxy>', 'proxy setting, default: null')
  .option('-s, --savecache', 'save origin ts file for backup')
  .option('-r, --resolution <number>', 'video resolution, one of [360, 480, 720, 1080], default: 1080')
  .option('-o, --output <filename>', 'output file name')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log('Usage: ', 'node . --channel mahjong --duration 10 -r 1080 --output mahjong-10-minutes-1090p.ts');
  program.outputHelp();
}
else if (program.list) {
  const deviceInfo = createUserDevice();
  const {deviceId, applicationKeySecret} = deviceInfo;

  // set proxy
  if (program.proxy) {
    setProxy(program.proxy);
  }

  registUserDevicePromise(deviceId, applicationKeySecret)
    .then(getUserDetailsPromise)
    .then(getMediaDetailsPromise)
    .then((ret) => {
      require('fs').writeFileSync('program-list.json', JSON.stringify(ret, null, 2));
      const padding = 8;
      const { channels } = ret;
      const maxLength = channels.reduce((a, b)=>{
        if (a === 0) {
          return b.id.length;
        }
        if (a < b.id.length) {
          return b.id.length;
        }
        return a;
      }, 0);

      console.log(`Id${' '.repeat(maxLength-2+padding)}Name`);
      ret.channels.forEach((c) => {
        console.log(`${c.id}${' '.repeat(maxLength-c.id.length+padding)}${c.name}`);
      });
    });
}
else {
  const scheduleOptions = {
    channelId: 'abema-news',
    recordDuration: 30,
    // proxy: 'socks://127.0.0.1:8484',
  };
  // todo: add an option for schedule recording
  const d = new Date();
  scheduleOptions.recordStart = d;

  if (program.channel) {
    scheduleOptions.channelId = program.channel;
  }
  if (program.duration) {
    scheduleOptions.recordDuration = program.duration;
  }
  if (program.savecache) {
    scheduleOptions.saveCacheFile = program.savecache;
  }
  if (program.resolution) {
    scheduleOptions.resolution = program.resolution;
  }
  if (program.output) {
    scheduleOptions.outputFileName = program.output;
  }

  // set proxy
  if (program.proxy) {
    setProxy(program.proxy);
  }

  const deviceInfo = createUserDevice();
  const {deviceId, applicationKeySecret} = deviceInfo;
  registUserDevicePromise(deviceId, applicationKeySecret)
    .then(getUserDetailsPromise)
    .then(getMediaDetailsPromise)
    .then(getMediaTokenPromise)
    .then(scheduleDumpPromise.bind(null, scheduleOptions))
    .then((result) => {
      // console.log('all done, the log file has been saved as last_playlist.json');
    })
    .catch((err) =>{
      console.log(err);
    });
}
