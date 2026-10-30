import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
  domain: process.env.MAIL_DOMAIN || 'example.com',
  serverHost: process.env.SERVER_HOST || 'mail.example.com',
  serverIp: process.env.SERVER_IP || '127.0.0.1',
  smtpPort: parseInt(process.env.SMTP_PORT || '2525', 10),
  httpPort: parseInt(process.env.PORT || '4000', 10),
  defaultFromAddress: process.env.DEFAULT_FROM || 'admin@example.com',
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

  getEmails({ folder = 'inbox', search = '' } = {}) {
    let emails = readJsonFile(EMAILS_FILE, []);
    
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

    // Sort newest first
    return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getEmailById(id) {
    const emails = readJsonFile(EMAILS_FILE, []);
    return emails.find(e => e.id === id) || null;
  },

  saveEmail(emailData) {
    const emails = readJsonFile(EMAILS_FILE, []);
    const newEmail = {
      id: emailData.id || uuidv4(),
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
      // Remove attachments
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

  getStats() {
    const emails = readJsonFile(EMAILS_FILE, []);
    const inboxCount = emails.filter(e => e.folder === 'inbox').length;
    const unreadInbox = emails.filter(e => e.folder === 'inbox' && !e.read).length;
    const sentCount = emails.filter(e => e.folder === 'sent').length;
    const trashCount = emails.filter(e => e.folder === 'trash').length;

    return {
      total: emails.length,
      inboxCount,
      unreadInbox,
      sentCount,
      trashCount
    };
  }
};
