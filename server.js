const express = require("express");
const config = require("./src/config");
const logger = require("./src/logger");
const stateManager = require("./src/stateManager");
const taskScheduler = require("./src/taskScheduler");
const whatsappClient = require("./src/whatsappClient");
const routes = require("./src/routes");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(config.route, routes);

initializeApp();
const server = startServer();

// Handle Shutdown
process.on("SIGTERM", () => {
  logger.log("Received SIGTERM, shutting down gracefully");
  server.close(() => {
    logger.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.log("Received SIGINT, shutting down gracefully");
  server.close(() => {
    logger.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;

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

function startServer() {
  const server = app.listen(config.port, () => {
    logger.log(`WhatsApp Bot Server listening on port ${config.port}`);
    logger.log(`API endpoint: ${config.route}`);
  });

  server.setTimeout(config.serverTimeout);

  return server;
}
