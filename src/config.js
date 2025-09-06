const path = require('path');

module.exports = {
  port: 3000,
  route: '/bot2',
  connectionTimeout: 120000,
  stateFile: path.join(__dirname, 'data2.json'),
  maxClients: 5,
  clientStartDelay: 5000,
  cronInterval: 1000,
  serverTimeout: 15000,
  
  puppeteerConfig: {
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
  
  whatsappVersion: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  }
};