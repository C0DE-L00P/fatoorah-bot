const fs = require('fs');
const config = require('./config');
const logger = require('./logger');

class StateManager {
  constructor() {
    this.clients = [];
    this.accounts = {};
  }

  writeState() {
    const states = this.clients.map((x) => ({
      state: x.state,
      connected_to: x.connected_to,
    }));
    fs.writeFileSync(config.stateFile, JSON.stringify(states));
  }

  loadState(restoreCallback) {
    fs.readFile(config.stateFile, (err, data) => {
      if (err) {
        logger.log('Error reading state file:', err.message);
        return;
      }

      if (data) {
        let content = [];
        try {
          content = JSON.parse(data);
        } catch (error) {
          logger.log('Error parsing state file:', error.message);
          return;
        }

        for (const key in content) {
          if (Object.hasOwnProperty.call(content, key)) {
            const element = content[key];
            if (element.connected_to && element.state === 'ready') {
              restoreCallback(element.connected_to, key);
            }
          }
        }
      }
    });
  }

  startStateWriter() {
    setInterval(() => this.writeState(), 1000);
  }

  getClients() {
    return this.clients;
  }

  getAccounts() {
    return this.accounts;
  }

  setClient(index, client) {
    this.clients[index] = client;
  }

  getClient(index) {
    return this.clients[index];
  }

  setAccount(token, account) {
    this.accounts[token] = account;
  }

  getAccount(token) {
    return this.accounts[token];
  }

  deleteAccount(token) {
    delete this.accounts[token];
  }
}

module.exports = new StateManager();