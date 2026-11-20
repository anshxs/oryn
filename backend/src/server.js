import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { storage, detectPublicIp } from './storage.js';
import { sendEmail } from './mailer.js';
import { getRecommendedDnsRecords, verifyDomainDns } from './dnsHelper.js';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Auto-detect public IP helper
  app.get('/api/public-ip', async (req, res) => {
    try {
      const ip = await detectPublicIp();
      res.json({ success: true, ip });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message, ip: '115.244.141.202' });
    }
  });

  // ---------------- DOMAIN ROUTES ----------------
  app.get('/api/domains', (req, res) => {
    try {
      const domains = storage.getDomains();
      res.json({ success: true, domains });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/domains', async (req, res) => {
    try {
      const { name, serverHost, serverIp } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Domain name is required (e.g. yourcompany.com)' });
      }
      const realIp = serverIp || await detectPublicIp();
      const newDomain = storage.addDomain({ name, serverHost, serverIp: realIp });

      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('domain_added', newDomain);
      }

      res.json({ success: true, domain: newDomain });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/domains/:name', (req, res) => {
    try {
      const { serverIp, serverHost } = req.body;
      const updated = storage.updateDomain(req.params.name, {
        ...(serverIp ? { serverIp: serverIp.trim() } : {}),
        ...(serverHost ? { serverHost: serverHost.trim() } : {})
      });
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('domain_updated', updated);
      }
      res.json({ success: true, domain: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/domains/:name', (req, res) => {
    try {
      storage.deleteDomain(req.params.name);
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('domain_deleted', { name: req.params.name });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------- MAILBOX ROUTES ----------------
  app.get('/api/mailboxes', (req, res) => {
    try {
      const { domain } = req.query;
      const mailboxes = storage.getMailboxes(domain);
      res.json({ success: true, mailboxes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/mailboxes', (req, res) => {
    try {
      const { email, username, domain, password, name } = req.body;
      const newMailbox = storage.createMailbox({ email, username, domain, password, name });

      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('mailbox_created', newMailbox);
      }

      res.json({ success: true, mailbox: newMailbox });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/mailboxes/verify', (req, res) => {
    try {
      const { email, password } = req.body;
      const valid = storage.verifyMailbox(email, password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const mailbox = storage.getMailboxByEmail(email);
      res.json({ success: true, mailbox });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/mailboxes/:email', (req, res) => {
    try {
      storage.deleteMailbox(req.params.email);
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('mailbox_deleted', { email: req.params.email });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------- EMAIL ROUTES ----------------
  app.get('/api/emails', (req, res) => {
    try {
      const { mailbox, folder, search } = req.query;
      const emails = storage.getEmails({ mailbox, folder, search });
      res.json({ success: true, emails });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

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

  app.post('/api/emails/send', async (req, res) => {
    try {
      const { from, to, cc, bcc, subject, text, html, attachments } = req.body;
      if (!to || !to.trim()) {
        return res.status(400).json({ success: false, error: 'Recipient address is required.' });
      }
      if (!from || !from.trim()) {
        return res.status(400).json({ success: false, error: 'Sender "from" mailbox is required.' });
      }

      const result = await sendEmail({ from, to, cc, bcc, subject, text, html, attachments });
      
      if (req.app.get('broadcast')) {
        req.app.get('broadcast')('email_sent', result.savedEmail);
      }

      res.json({ success: true, message: 'Email sent successfully', email: result.savedEmail });
    } catch (err) {
      console.error('Error sending email:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/emails/simulate', (req, res) => {
    try {
      const { mailbox, from, to, subject, text, html } = req.body;
      const targetMailbox = (mailbox || to || 'ansh@example.com').toLowerCase();

      const simulatedEmail = storage.saveEmail({
        mailbox: targetMailbox,
        folder: 'inbox',
        from: from || `customer@clientdomain.com`,
        to: to || targetMailbox,
        subject: subject || `Welcome to ${targetMailbox}!`,
        text: text || `This is a test inbound email sent to your custom address ${targetMailbox}.`,
        html: html || `<p>This is a <strong>test inbound email</strong> sent to your mailbox <code>${targetMailbox}</code>.</p>`,
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

  // Attachments
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

  // Settings
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

  // DNS
  app.get('/api/dns/records', async (req, res) => {
    try {
      const settings = storage.getSettings();
      const domainName = req.query.domain || settings.domain || 'example.com';
      const domains = storage.getDomains();
      const matchedDomain = domains.find(d => (d.name || '').toLowerCase() === domainName.toLowerCase());

      const host = req.query.host || matchedDomain?.serverHost || `mail.${domainName}`;
      let ip = req.query.ip || matchedDomain?.serverIp || settings.serverIp;
      if (!ip || ip === '127.0.0.1') {
        ip = await detectPublicIp();
      }

      const records = getRecommendedDnsRecords(domainName, host, ip);
      res.json({ success: true, domain: domainName, host, ip, records });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/dns/verify', async (req, res) => {
    try {
      const domain = req.query.domain;
      if (!domain) {
        return res.status(400).json({ success: false, error: 'Domain parameter is required' });
      }
      const host = req.query.host || `mail.${domain}`;
      const check = await verifyDomainDns(domain, host);
      res.json({ success: true, check });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Stats
  app.get('/api/stats', (req, res) => {
    try {
      const { mailbox } = req.query;
      const stats = storage.getStats(mailbox);
      const settings = storage.getSettings();
      res.json({
        success: true,
        stats,
        server: {
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
