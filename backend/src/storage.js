import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DOMAINS_FILE = path.join(DATA_DIR, 'domains.json');
const MAILBOXES_FILE = path.join(DATA_DIR, 'mailboxes.json');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

function hashPassword(password) {
  const salt = 'oryn_salt_sec_';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

const DEFAULT_SETTINGS = {
  domain: process.env.MAIL_DOMAIN || 'example.com',
  serverHost: process.env.SERVER_HOST || 'mail.example.com',
  serverIp: process.env.SERVER_IP || '127.0.0.1',
  smtpPort: parseInt(process.env.SMTP_PORT || '2525', 10),
  httpPort: parseInt(process.env.PORT || '4000', 10),
  outboundMode: 'direct', // 'direct' or 'relay'
  relay: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: ''
  }
};

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export const storage = {
  // Settings
  getSettings() {
    return readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  },

  updateSettings(updates) {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
      relay: {
        ...current.relay,
        ...(updates.relay || {})
      }
    };
    writeJsonFile(SETTINGS_FILE, updated);
    return updated;
  },

  // ---------------- DOMAINS ----------------
  getDomains() {
    let domains = readJsonFile(DOMAINS_FILE, []);
    if (!domains || domains.length === 0 || !domains[0]?.name) {
      const settings = this.getSettings();
      const initialDomain = settings.domain || settings.defaultDomain || 'example.com';
      domains = [{
        id: uuidv4(),
        name: initialDomain,
        serverHost: settings.serverHost || `mail.${initialDomain}`,
        serverIp: settings.serverIp || '127.0.0.1',
        createdAt: new Date().toISOString(),
        verified: false
      }];
      writeJsonFile(DOMAINS_FILE, domains);
    }
    return domains;
  },

  addDomain({ name, serverHost, serverIp }) {
    const domains = this.getDomains();
    const cleanName = (name || '').trim().toLowerCase();
    if (!cleanName) throw new Error('Domain name cannot be empty.');

    if (domains.some(d => (d.name || '').toLowerCase() === cleanName)) {
      throw new Error(`Domain "${cleanName}" is already added.`);
    }

    const settings = this.getSettings();
    const newDomain = {
      id: uuidv4(),
      name: cleanName,
      serverHost: (serverHost || `mail.${cleanName}`).trim().toLowerCase(),
      serverIp: (serverIp || settings.serverIp || '127.0.0.1').trim(),
      createdAt: new Date().toISOString(),
      verified: false
    };

    domains.push(newDomain);
    writeJsonFile(DOMAINS_FILE, domains);
    return newDomain;
  },

  deleteDomain(domainName) {
    const cleanName = (domainName || '').trim().toLowerCase();
    let domains = this.getDomains();
    domains = domains.filter(d => (d.name || '').toLowerCase() !== cleanName);
    writeJsonFile(DOMAINS_FILE, domains);

    let mailboxes = readJsonFile(MAILBOXES_FILE, []);
    mailboxes = mailboxes.filter(m => (m.domain || '').toLowerCase() !== cleanName);
    writeJsonFile(MAILBOXES_FILE, mailboxes);

    return true;
  },

  isDomainAllowed(domainName) {
    if (!domainName) return false;
    const cleanName = domainName.trim().toLowerCase();
    const domains = this.getDomains();
    return domains.some(d => (d.name || '').toLowerCase() === cleanName);
  },

  // ---------------- MAILBOXES ----------------
  getMailboxes(domain = null) {
    let mailboxes = readJsonFile(MAILBOXES_FILE, []);
    if (mailboxes.length === 0) {
      // Seed default initial mailbox
      const domains = this.getDomains();
      const firstDomain = domains[0]?.name || 'example.com';
      const initial = [{
        id: uuidv4(),
        email: `ansh@${firstDomain}`,
        username: 'ansh',
        domain: firstDomain,
        name: 'Ansh Sharma',
        passwordHash: hashPassword('password123'),
        createdAt: new Date().toISOString()
      }];
      writeJsonFile(MAILBOXES_FILE, initial);
      return initial;
    }

    if (domain) {
      mailboxes = mailboxes.filter(m => m.domain.toLowerCase() === domain.toLowerCase());
    }

    // Return without password hashes
    return mailboxes.map(({ passwordHash, ...safe }) => safe);
  },

  getMailboxByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const mailboxes = readJsonFile(MAILBOXES_FILE, []);
    return mailboxes.find(m => m.email.toLowerCase() === cleanEmail) || null;
  },

  createMailbox({ email, username, domain, password, name }) {
    let cleanEmail = '';
    let user = username ? username.trim().toLowerCase() : '';
    let dom = domain ? domain.trim().toLowerCase() : '';

    if (email && email.includes('@')) {
      const parts = email.trim().toLowerCase().split('@');
      user = parts[0];
      dom = parts[1];
      cleanEmail = email.trim().toLowerCase();
    } else if (user && dom) {
      cleanEmail = `${user}@${dom}`;
    } else {
      throw new Error('Valid email or username and domain are required.');
    }

    if (!this.isDomainAllowed(dom)) {
      throw new Error(`Domain "${dom}" is not registered. Please add the domain first.`);
    }

    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const mailboxes = readJsonFile(MAILBOXES_FILE, []);
    if (mailboxes.some(m => m.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Mailbox "${cleanEmail}" already exists.`);
    }

    const newMailbox = {
      id: uuidv4(),
      email: cleanEmail,
      username: user,
      domain: dom,
      name: name?.trim() || user,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    mailboxes.push(newMailbox);
    writeJsonFile(MAILBOXES_FILE, mailboxes);

    const { passwordHash, ...safe } = newMailbox;
    return safe;
  },

  verifyMailbox(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const mailboxes = readJsonFile(MAILBOXES_FILE, []);
    const mailbox = mailboxes.find(m => m.email.toLowerCase() === cleanEmail);
    if (!mailbox) return false;
    return mailbox.passwordHash === hashPassword(password);
  },

  deleteMailbox(email) {
    const cleanEmail = email.trim().toLowerCase();
    let mailboxes = readJsonFile(MAILBOXES_FILE, []);
    mailboxes = mailboxes.filter(m => m.email.toLowerCase() !== cleanEmail);
    writeJsonFile(MAILBOXES_FILE, mailboxes);
    return true;
  },

  // ---------------- EMAILS ----------------
  getEmails({ mailbox = '', folder = 'inbox', search = '' } = {}) {
    let emails = readJsonFile(EMAILS_FILE, []);
    const cleanMailbox = mailbox ? mailbox.trim().toLowerCase() : '';

    if (cleanMailbox) {
      emails = emails.filter(e => {
        const toMatch = (e.to && e.to.toLowerCase().includes(cleanMailbox)) ||
                        (e.mailbox && e.mailbox.toLowerCase() === cleanMailbox);
        const fromMatch = e.from && e.from.toLowerCase().includes(cleanMailbox);
        
        if (folder === 'sent') {
          return fromMatch || e.mailbox === cleanMailbox;
        }
        return toMatch || e.mailbox === cleanMailbox;
      });
    }
    
    if (folder === 'starred') {
      emails = emails.filter(e => e.starred && e.folder !== 'trash');
    } else if (folder) {
      emails = emails.filter(e => e.folder === folder);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      emails = emails.filter(e =>
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.from && e.from.toLowerCase().includes(q)) ||
        (e.to && e.to.toLowerCase().includes(q)) ||
        (e.text && e.text.toLowerCase().includes(q))
      );
    }

    return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getEmailById(id) {
    const emails = readJsonFile(EMAILS_FILE, []);
    return emails.find(e => e.id === id) || null;
  },

  saveEmail(emailData) {
    const emails = readJsonFile(EMAILS_FILE, []);
    
    // Determine target mailbox
    let targetMailbox = emailData.mailbox || '';
    if (!targetMailbox && emailData.to) {
      const match = emailData.to.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (match) targetMailbox = match[0].toLowerCase();
    }

    const newEmail = {
      id: emailData.id || uuidv4(),
      mailbox: targetMailbox.toLowerCase(),
      folder: emailData.folder || 'inbox',
      from: emailData.from || 'unknown@example.com',
      to: emailData.to || '',
      cc: emailData.cc || '',
      bcc: emailData.bcc || '',
      subject: emailData.subject || '(No Subject)',
      text: emailData.text || '',
      html: emailData.html || '',
      date: emailData.date || new Date().toISOString(),
      read: emailData.read !== undefined ? emailData.read : false,
      starred: !!emailData.starred,
      attachments: emailData.attachments || [],
      headers: emailData.headers || {},
      rawSize: emailData.rawSize || 0
    };

    emails.unshift(newEmail);
    writeJsonFile(EMAILS_FILE, emails);
    return newEmail;
  },

  updateEmail(id, updates) {
    const emails = readJsonFile(EMAILS_FILE, []);
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) return null;

    emails[index] = { ...emails[index], ...updates };
    writeJsonFile(EMAILS_FILE, emails);
    return emails[index];
  },

  deleteEmail(id, permanent = false) {
    const emails = readJsonFile(EMAILS_FILE, []);
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) return false;

    if (permanent || emails[index].folder === 'trash') {
      if (emails[index].attachments && emails[index].attachments.length > 0) {
        for (const att of emails[index].attachments) {
          if (att.path && fs.existsSync(att.path)) {
            try { fs.unlinkSync(att.path); } catch (e) {}
          }
        }
      }
      emails.splice(index, 1);
    } else {
      emails[index].folder = 'trash';
    }

    writeJsonFile(EMAILS_FILE, emails);
    return true;
  },

  saveAttachment(filename, buffer) {
    const fileId = uuidv4() + '_' + filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(ATTACHMENTS_DIR, fileId);
    fs.writeFileSync(filePath, buffer);
    return {
      id: fileId,
      filename,
      path: filePath,
      size: buffer.length
    };
  },

  getStats(mailbox = null) {
    let emails = readJsonFile(EMAILS_FILE, []);
    if (mailbox) {
      const cleanMailbox = mailbox.toLowerCase();
      emails = emails.filter(e => 
        (e.mailbox && e.mailbox === cleanMailbox) ||
        (e.to && e.to.toLowerCase().includes(cleanMailbox)) ||
        (e.from && e.from.toLowerCase().includes(cleanMailbox))
      );
    }
    const inboxCount = emails.filter(e => e.folder === 'inbox').length;
    const unreadInbox = emails.filter(e => e.folder === 'inbox' && !e.read).length;
    const sentCount = emails.filter(e => e.folder === 'sent').length;
    const trashCount = emails.filter(e => e.folder === 'trash').length;

    const domains = this.getDomains();
    const mailboxes = this.getMailboxes();

    return {
      total: emails.length,
      inboxCount,
      unreadInbox,
      sentCount,
      trashCount,
      domainCount: domains.length,
      mailboxCount: mailboxes.length
    };
  }
};
