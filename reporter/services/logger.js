export default class Logger {
  constructor() {
    this.loggerStack = [];
  };

  setTestLog(log) {
    const logObj = { message: log, timestamp: Date.now(), level: 'INFO' }
    this.loggerStack.push(logObj);
  }
  getTestLogs() {
    const obj = JSON.parse(JSON.stringify(this.loggerStack));
    this.loggerStack = [];
    return obj;
  }
}