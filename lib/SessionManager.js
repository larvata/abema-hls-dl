class SessionManager {
  constructor({agent, mediaToken}) {
    this.agent = agent;
    this.userToken = null;
    this.userId = null;
    this.mediaToken = mediaToken;
    this.segmentList = [];
    this.isRecording = false;
    this.millisecondInCache = 0;
  }

  getSession() {
    return {
      agent: this.agent,
      userToken: this.userToken,
      userId: this.userId,
      mediaToken: this.mediaToken,
      segmentList: this.segmentList,
      isRecording: this.isRecording,
      millisecondInCache: this.millisecondInCache,
    };
  }
};

module.exports = SessionManager;
