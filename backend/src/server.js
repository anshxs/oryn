import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { storage } from './storage.js';
import { sendEmail } from './mailer.js';
import { getRecommendedDnsRecords, verifyDomainDns } from './dnsHelper.js';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // REST API Routes

  // 1. Get emails by folder and search
  app.get('/api/emails', (req, res) => {
    try {
      const { folder, search } = req.query;
      const emails = storage.getEmails({ folder, search });
      res.json({ success: true, emails });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Get single email by ID
  app.get('/api/emails/:id', (req, res) => {
    try {
      const email = storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ success: false, error: 'Email not found' });
      }
      res.json({ success: true, email });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Send outbound email
  app.post('/api/emails/send', async (req, res) => {
    try {
      const { from, to, cc, bcc, subject, text, html, attachments } = req.body;
      if (!to || !to.trim()) {
        return res.status(400).json({ success: false, error: 'Recipient "to" address is required.' });
      }

      const result = await sendEmail({ from, to, cc, bcc, subject, text, html, attachments });
      
      // Notify WS clients of sent email
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('email_sent', result.savedEmail);
      }

      res.json({ success: true, message: 'Email sent successfully', email: result.savedEmail });
    } catch (err) {
      console.error('Error sending email:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Simulate inbound email (for quick developer testing without an external SMTP client)
  app.post('/api/emails/simulate', (req, res) => {
    try {
      const settings = storage.getSettings();
      const { from, to, subject, text, html } = req.body;

      const simulatedEmail = storage.saveEmail({
        folder: 'inbox',
        from: from || `customer@client-domain.com`,
        to: to || `hello@${settings.domain}`,
        subject: subject || 'Welcome to your custom domain mailserver!',
        text: text || 'This is a test inbound email received on your configured domain.',
        html: html || `<p>This is a <strong>test inbound email</strong> received on your configured domain <code>${settings.domain}</code>.</p>`,
        date: new Date().toISOString(),
        read: false,
        starred: false
      });

      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('new_email', simulatedEmail);
      }

      res.json({ success: true, email: simulatedEmail });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Update email (mark as read/unread, star, move folder)
  app.patch('/api/emails/:id', (req, res) => {
    try {
      const updated = storage.updateEmail(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Email not found' });
      }

      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('email_updated', updated);
      }

      res.json({ success: true, email: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Delete email (move to trash or permanently remove)
  app.delete('/api/emails/:id', (req, res) => {
    try {
      const permanent = req.query.permanent === 'true';
      const success = storage.deleteEmail(req.params.id, permanent);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Email not found' });
      }

      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('email_deleted', { id: req.params.id, permanent });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Download / view attachment
  app.get('/api/attachments/:fileId', (req, res) => {
    try {
      const fileId = req.params.fileId;
      const dataDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'attachments');
      const filePath = path.join(dataDir, fileId);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Attachment not found');
      }

      res.download(filePath);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // 8. Settings & Domain configuration
  app.get('/api/settings', (req, res) => {
    try {
      const settings = storage.getSettings();
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/settings', (req, res) => {
    try {
      const updated = storage.updateSettings(req.body);
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('settings_updated', updated);
      }
      res.json({ success: true, settings: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. DNS Records guide & Live verification
  app.get('/api/dns/records', (req, res) => {
    try {
      const settings = storage.getSettings();
      const domain = req.query.domain || settings.domain;
      const host = req.query.host || settings.serverHost;
      const ip = req.query.ip || settings.serverIp;

      const records = getRecommendedDnsRecords(domain, host, ip);
      res.json({ success: true, domain, host, ip, records });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/dns/verify', async (req, res) => {
    try {
      const settings = storage.getSettings();
      const domain = req.query.domain || settings.domain;
      const host = req.query.host || settings.serverHost;

      const check = await verifyDomainDns(domain, host);
      res.json({ success: true, check });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Server stats
  app.get('/api/stats', (req, res) => {
    try {
      const stats = storage.getStats();
      const settings = storage.getSettings();
      res.json({
        success: true,
        stats,
        server: {
          domain: settings.domain,
          smtpPort: settings.smtpPort,
          outboundMode: settings.outboundMode,
          uptime: process.uptime()
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}

export function createHttpAndWebSocketServer(app) {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'connected', time: new Date().toISOString() }));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err);
      clients.delete(ws);
    });
  });

  const broadcast = (type, payload) => {
    const message = JSON.stringify({ type, payload });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  app.set('broadcast', broadcast);

  return { server, broadcast };
}
