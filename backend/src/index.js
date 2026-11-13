import dotenv from 'dotenv';
dotenv.config();

import { createExpressApp, createHttpAndWebSocketServer } from './server.js';
import { createSmtpServer } from './smtpServer.js';
import { storage } from './storage.js';

const settings = storage.getSettings();
const HTTP_PORT = process.env.PORT || settings.httpPort || 4000;
const SMTP_PORT = process.env.SMTP_PORT || settings.smtpPort || 2525;

// Initialize Express App and HTTP/WS Server
const app = createExpressApp();
const { server: httpServer, broadcast } = createHttpAndWebSocketServer(app);

// Initialize Inbound SMTP Server
const smtpServer = createSmtpServer((newEmail) => {
  // Broadcast new email to all connected frontend clients in real time
  broadcast('new_email', newEmail);
});

// Start HTTP & WebSocket server
httpServer.listen(HTTP_PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Oryn Mail API & WebSockets: http://localhost:${HTTP_PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${HTTP_PORT}/ws`);
  console.log(`===============================================`);
});

// Start Inbound SMTP Server
smtpServer.listen(SMTP_PORT, () => {
  console.log(`📬 Inbound SMTP Server listening on port ${SMTP_PORT}`);
  console.log(`🏷️  Configured domain: ${settings.domain}`);
  console.log(`💻 Server Host: ${settings.serverHost}`);
  console.log(`===============================================`);
});

function handleShutdown() {
  console.log('\nShutting down servers...');
  smtpServer.close(() => {
    httpServer.close(() => {
      console.log('Servers shut down successfully.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
