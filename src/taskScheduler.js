const config = require('./config');
const logger = require('./logger');

class TaskScheduler {
  constructor() {
    this.scheduledTasks = {};
    this.cronjobCounter = 0;
  }

  initializeTask(taskId, data) {
    if (this.scheduledTasks[taskId] === undefined) {
      this.scheduledTasks[taskId] = [];
    }
    
    if (data.message) this.scheduledTasks[taskId].message = data.message;
    if (data.numbers) this.scheduledTasks[taskId].numbers = data.numbers;
    if (data.client) this.scheduledTasks[taskId].client = data.client;
    if (data.schedule) this.scheduledTasks[taskId].schedule = data.schedule;
  }

  getTaskStatus(taskId) {
    if (this.scheduledTasks[taskId]) {
      const started = this.scheduledTasks[taskId].schedule ? true : false;
      const completed = this.scheduledTasks[taskId].completed_numbers
        ? this.scheduledTasks[taskId].completed_numbers
        : 0;
      const remaining = Object.keys(this.scheduledTasks[taskId].numbers).length - completed;
      
      return {
        status: 'success',
        completed,
        remaining,
        started,
      };
    } else {
      return {
        status: 'failed',
        message: 'no such task',
      };
    }
  }

  removeTask(taskId) {
    if (this.scheduledTasks[taskId]) {
      delete this.scheduledTasks[taskId];
    }
  }

  getAllTasks() {
    return this.scheduledTasks;
  }

  startCron() {
    setInterval(() => {
      for (const key in this.scheduledTasks) {
        if (Object.hasOwnProperty.call(this.scheduledTasks, key)) {
          const element = this.scheduledTasks[key];
          if (element.schedule && element.message) {
            this.processScheduledTask(element);
          }
        }
      }
      this.cronjobCounter++;
    }, config.cronInterval);
  }

  processScheduledTask(element) {
    // Date validation
    const dt = new Date(element.schedule.date + ' 00:00:00');
    if (Date.now() - dt <= 0) return;

    // Time validation
    const startTimeArray = element.schedule.start_time.split(':');
    const endTimeArray = element.schedule.end_time.split(':');
    const startTime = new Date();
    const endTime = new Date();
    
    startTime.setHours(startTimeArray[0], startTimeArray[1], 1);
    endTime.setHours(endTimeArray[0], endTimeArray[1], 1);

    if (Date.now() - startTime <= 0 || endTime - Date.now() <= 0) return;

    // Timer validation and execution
    if (this.cronjobCounter % element.schedule.timer === 0) {
      const currentNumber = element.numbers.pop();
      if (currentNumber !== undefined) {
        if (!element.completed_numbers) {
          element.completed_numbers = [];
        }
        element.completed_numbers.push(currentNumber);
        const chatId = currentNumber + '@c.us';
        
        element.client.sendMessage(chatId, element.message)
          .then(() => {
            logger.log(`Message sent to ${currentNumber}`);
          })
          .catch((error) => {
            logger.log(`Failed to send message to ${currentNumber}:`, error.message);
          });
      }
    }
  }
}

module.exports = new TaskScheduler();