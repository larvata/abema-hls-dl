const {CACHE_MILLISECONDS} = require('./constants');

// todo code for validate the options
// ...
class SessionManager {
  constructor({agent, mediaToken}) {
    this.agent = agent;
    this.userToken = null;
    this.userId = null;
    this.mediaToken = mediaToken;
    this.segmentList = [];
    this.isRecording = false;
    this.startTime = null;
    this.cachedTime = null;
    this.proxy = null;
    this.isRecording = false;
  }

  setProxy(proxy) {
    this.proxy = proxy;
  }

  setScheduledTimeEnd(scheduledTimeEnd) {
    this.scheduledTimeEnd = scheduledTimeEnd;
  }

  recordingStart(scheduledTimeEnd) {
    this.isRecording = true;
    this.startTime = new Date().getTime();
    this.scheduledTimeEnd = scheduledTimeEnd;
  }

  feedCacheDuration(duration) {
    if (!this.cachedTime) {
      this.cachedTime = new Date().getTime();
    }
    this.cachedTime = this.cachedTime + duration;
  }

  shouldContinueRecord() {
    return this.cachedTime < this.scheduledTimeEnd;
  }

  getCacheDuration() {
    let waitMilliSeconds = this.cachedTime - new Date().getTime() - CACHE_MILLISECONDS;
    return waitMilliSeconds;
  }

  getCacheWaitTime() {
    let result = this.getCacheDuration();
    if (result < 0) {
      result = 0;
    }
    return result;
  }
};

module.exports = SessionManager;
