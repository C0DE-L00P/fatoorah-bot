const express = require('express');
const config = require('./config');
const logger = require('./logger');
const stateManager = require('./stateManager');
const taskScheduler = require('./taskScheduler');
const whatsappClient = require('./whatsappClient');
const routes = require('./routes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(config.route, routes);

// Initialize application
function initializeApp() {
  // Load previous state
  stateManager.loadState((token, id) => {
    whatsappClient.restore(token, id);
  });

  // Start state writer
  stateManager.startStateWriter();

  // Start task scheduler
  taskScheduler.startCron();

  // Initialize clients with delay
  for (let index = 0; index < config.maxClients; index++) {
    setTimeout(() => {
      whatsappClient.startClient(index);
    }, index * config.clientStartDelay);
  }
}

// Start server
function startServer() {
  const server = app.listen(config.port, () => {
    logger.log(`WhatsApp Bot Server listening on port ${config.port}`);
    logger.log(`API endpoint: ${config.route}`);
  });

  server.setTimeout(config.serverTimeout);
  
  return server;
}

// Initialize and start
initializeApp();
const server = startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    logger.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;