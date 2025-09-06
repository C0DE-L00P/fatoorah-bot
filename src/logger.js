class Logger {
    constructor() {
      this.logs = [];
    }
  
    log(...args) {
      console.log(...args);
      this.logs.push({
        time: Date.now(),
        message: args,
      });
    }
  
    getLogs() {
      return this.logs;
    }
  
    clearLogs() {
      this.logs = [];
    }
  }
  
  module.exports = new Logger();