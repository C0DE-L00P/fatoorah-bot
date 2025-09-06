import qrcode from 'qrcode-terminal';
import whatsapp from 'whatsapp-web.js';

const { Client, LocalAuth } = whatsapp;

let client;
let clientReady = false;

export const initWhatsAppClient = () => {
  try {
    client = new Client({
      authStrategy: new LocalAuth(),
      
      puppeteer: {
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: false,
        args: ['--no-sandbox'],
      },
    });

    client.initialize();

    client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      console.log('Scan the QR code above to authenticate.');
    });

    client.on('ready', async() => {
      clientReady = true;
      console.log('WhatsApp client is ready!', clientReady);
      if(clientReady) await client.sendMessage('+201024959020', 'Ping!');
    });
  } catch (error) {
    console.error('Error initializing WhatsApp client:', error);
    // Sentry.captureException(error);
  }
}

initWhatsAppClient();

export async function sendWhatsAppMessage(message, groupName) {
  if (!clientReady) {
    console.log('WhatsApp client is not ready. Please wait for the QR code scan.');
    return;
  }

  if (!groupName || !message) {
    console.log({ error: 'Missing groupName or message in request body.' });
    return;
  }

  try {
    const chats = await client.getChats();
    const group = chats.find((chat) => chat.isGroup && chat.name === groupName);

    if (!group) {
      console.log({ error: `Group "${groupName}" not found.` });
      return;
    }

    await client.sendMessage(group.id._serialized, message);
  } catch (e) {
    console.error('Error sending message:', e);
  }

}