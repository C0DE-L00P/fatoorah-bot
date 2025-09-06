const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const config = require('./config');
const logger = require('./logger');
const stateManager = require('./stateManager');

class WhatsAppClient {
  constructor() {
    this.clients = stateManager.getClients();
    this.accounts = stateManager.getAccounts();
  }

  startClient(index) {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: 'client-' + index }),
      webVersionCache: config.whatsappVersion,
      restartOnAuthFail: true,
      puppeteer: config.puppeteerConfig,
    });

    stateManager.setClient(index, {
      client: client,
      state: 'waiting for qr',
      connected_to: null,
    });

    this.setupEventListeners(client, index);
  }

  setupEventListeners(client, index) {
    client.on('disconnected', () => {
      const connectedTo = this.clients[index].connected_to;
      if (connectedTo) {
        stateManager.deleteAccount(connectedTo);
      }
      this.clients[index].connected_to = null;
      client.resetState();
      logger.log('disconnected', ' ', index);
      this.clients[index].state = 'waiting for qr';
    });

    client.on('qr', (qr) => {
      logger.log('qr', ' ', index);
      if (this.clients[index].connected_to != null) {
        const connectedTo = this.clients[index].connected_to;
        this.accounts[connectedTo].qrr = qr;
        logger.log('qr', ' ', connectedTo);
      }
    });

    client.on('ready', () => {
      logger.log('Client is ready!');
      this.clients[index].state = 'ready';
      if (this.clients[index].connected_to != null) {
        logger.log('client connected', ' ', this.clients[index].connected_to);
        this.accounts[this.clients[index].connected_to].intializing = false;
      }
      logger.log('client connected', ' ', index);
    });

    client.on('authenticated', () => {
      logger.log('Client is authed!');
    });
  }

  initializeClient(token, index) {
    let client = null;
    let clientIndex = null;

    setTimeout(() => {
      if (this.clients[index].state === 'waiting for qr') {
        const connectedTo = this.clients[index].connected_to;
        if (connectedTo) {
          stateManager.deleteAccount(connectedTo);
        }
        this.clients[index].connected_to = null;
        client.destroy();
        logger.log('disconnected', ' ', index);
        this.clients[index].state = 'waiting for qr';
      }
    }, config.connectionTimeout);

    try {
      const element = this.clients[index];
      if (element.connected_to == null) {
        client = element.client;
        clientIndex = index;
        element.connected_to = token;
      }
    } catch (error) {
      console.error('ERR', error.message);
    }

    if (client) {
      this.accounts[token].client = client;
      this.accounts[token].client_index = clientIndex;
      this.accounts[token].qrr = '';
      client.initialize();
      return true;
    } else {
      return false;
    }
  }

  async sendMessage(token, number, content, isText = false) {
    const account = this.accounts[token];
    if (!account || account.destroying != null || account.intializing) {
      throw new Error('Client not ready or being stopped');
    }

    const client = account.client;
    const state = await client.getState();
    
    if (state !== 'CONNECTED') {
      throw new Error('Client not connected');
    }

    const chatId = number.substring(1) + '@c.us';

    if (isText) {
      return await client.sendMessage(chatId, content);
    } else {
      const media = await MessageMedia.fromUrl(content);
      return await client.sendMessage(chatId, media);
    }
  }

  async destroyClient(token) {
    const account = this.accounts[token];
    if (!account) {
      throw new Error('Account not found');
    }

    const index = account.client_index;
    const client = account.client;
    
    stateManager.deleteAccount(token);
    await client.logout();
    await client.resetState();
    
    logger.log('disconnected', ' ', index);
    this.clients[index].state = 'waiting for qr';
  }

  restore(token, id) {
    if (this.accounts[token] == null) {
      stateManager.setAccount(token, { intializing: true });
      this.initializeClient(token, id);
    }
  }

  getClientStatuses() {
    return this.clients.map((el, index) => ({
      index: index,
      state: el.state,
    }));
  }
}

module.exports = new WhatsAppClient();