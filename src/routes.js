const express = require('express');
const qrimage = require('qr-image');
const config = require('./config');
const logger = require('./logger');
const stateManager = require('./stateManager');
const taskScheduler = require('./taskScheduler');
const whatsappClient = require('./whatsappClient');

const router = express.Router();

// Add new client
router.get('/add_client', async (req, res) => {
  whatsappClient.startClient(stateManager.getClients().length);
  res.send('added ' + (stateManager.getClients().length - 1));
});

// Initialize task
router.post('/intialize_task/:task_id', async (req, res) => {
  const key = req.params.task_id;
  const taskData = {
    message: req.body.message,
    numbers: req.body.numbers,
    client: req.body.client ? stateManager.getAccounts()[req.body.client].client : null,
    schedule: req.body.schedule,
  };
  
  taskScheduler.initializeTask(key, taskData);
  res.send('successfully intialized');
});

// Get task logs
router.get('/get_tasks_logs', async (req, res) => {
  res.send('logged');
  console.log(taskScheduler.getAllTasks());
});

// Get task status
router.get('/task_status/:task_id', async (req, res) => {
  const key = req.params.task_id;
  const status = taskScheduler.getTaskStatus(key);
  res.send(status);
});

// Remove task
router.get('/remove_task/:task_id', async (req, res) => {
  const key = req.params.task_id;
  taskScheduler.removeTask(key);
  res.send('successfully deleted');
});

// Get clients statuses
router.get('/get_clients_statuses', async (req, res) => {
  res.send(whatsappClient.getClientStatuses());
});

// Log clients
router.get('/log_clients', async (req, res) => {
  console.log(stateManager.getClients());
  res.send('logged');
});

// Log accounts
router.get('/log_accounts', async (req, res) => {
  console.log(stateManager.getAccounts());
  res.send('logged');
});

// Get logs
router.get('/get_logs', async (req, res) => {
  res.send(logger.getLogs());
});

// Clear logs
router.get('/clear_logs', async (req, res) => {
  logger.clearLogs();
  res.send('cleared');
});

// Destroy client
router.get('/destroy/:token', async (req, res) => {
  try {
    await whatsappClient.destroyClient(req.params.token);
    res.send('destroyed');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Get QR code
router.get('/get_qr/:token/:id', (req, res) => {
  const token = req.params.token;
  const id = req.params.id;
  const accounts = stateManager.getAccounts();

  function connected() {
    accounts[token].intializing = false;
  }

  function notConnected() {
    res.header('Content-Type: image/png');
    const img = qrimage.imageSync(accounts[token].qrr, {
      type: 'png',
    });
    res.send(`
    <html>
    <body>
    <img src="data:image/png;base64,${Buffer.from(img).toString('base64')}">
    <script>
    setInterval(()=>{
      location.href=location.href
    },1000)
    </script>
    </body>
    </html>
        `);
  }

  if (accounts[token] == null) {
    stateManager.setAccount(token, { intializing: true });
    if (whatsappClient.initializeClient(token, id)) {
      res.send('started connection');
    } else {
      res.send("couldn't assign user to client");
    }
  } else {
    if (accounts[token].destroying == null) {
      if (accounts[token].intializing) {
        notConnected();
      } else {
        connected();
        res.send('connected');
      }
    } else {
      res.send('Pending client stopping');
    }
  }
});

// Get state
router.get('/get_state/:token', (req, res) => {
  const accounts = stateManager.getAccounts();
  const clients = stateManager.getClients();
  
  if (accounts[req.params.token] != null) {
    if (accounts[req.params.token].intializing == false) {
      const index = accounts[req.params.token].client_index;
      res.send(clients[index].state);
    } else {
      res.send('pending connection');
    }
  } else {
    res.send('not started the client');
  }
});

// Get status
router.get('/get_status/:token', (req, res) => {
  const accounts = stateManager.getAccounts();
  
  if (accounts[req.params.token] != null) {
    if (accounts[req.params.token].intializing == false) {
      const client = accounts[req.params.token].client;
      client
        .getState()
        .then((state) => {
          res.send(state);
        })
        .catch(() => {
          res.send('unable to fetch state');
        });
    } else {
      res.send('pending connection');
    }
  } else {
    res.send('not started the client');
  }
});

// Send message
router.get('/send_message/:token', async (req, res) => {
  if (!req.query.number || !req.query.image_url) {
    return res.status(400).send('Missing number or content');
  }

  try {
    const token = req.params.token;
    const number = req.query.number;
    const content = req.query.image_url;
    const isText = req.query.is_text != null;

    await whatsappClient.sendMessage(token, number, content, isText);
    res.send('sent');
  } catch (error) {
    res.send(error.message);
  }
});

// Health check
router.get('/', (req, res) => {
  res.send('Bot Server Working');
});

module.exports = router;