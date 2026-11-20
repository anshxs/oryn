import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { MAILBOXES_FILE, readJson, writeJson } from '../helpers/fileStorage.js';
import { DomainModel } from './domain.model.js';

function hashPassword(password) {
  const salt = 'oryn_salt_sec_';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export const MailboxModel = {
  getAll(domainFilter = null) {
    let mailboxes = readJson(MAILBOXES_FILE, []);
    if (mailboxes.length === 0) {
      // Auto-seed default mailbox
      const domains = DomainModel.getAll();
      const firstDomain = domains[0]?.name || 'glennesports.app';
      const initial = [{
        id: uuidv4(),
        email: `ansh@${firstDomain}`,
        username: 'ansh',
        domain: firstDomain,
        name: 'Ansh Sharma',
        passwordHash: hashPassword('password123'),
        createdAt: new Date().toISOString()
      }];
      writeJson(MAILBOXES_FILE, initial);
      return initial.map(({ passwordHash, ...safe }) => safe);
    }

    if (domainFilter) {
      mailboxes = mailboxes.filter(m => m.domain.toLowerCase() === domainFilter.toLowerCase());
    }

    // Strip passwordHash before returning to controllers
    return mailboxes.map(({ passwordHash, ...safe }) => safe);
  },

  getByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const mailboxes = readJson(MAILBOXES_FILE, []);
    return mailboxes.find(m => m.email.toLowerCase() === cleanEmail) || null;
  },

  create({ email, username, domain, password, name }) {
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

    if (!DomainModel.isDomainAllowed(dom)) {
      throw new Error(`Domain "${dom}" is not registered. Please add the domain first.`);
    }

    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const mailboxes = readJson(MAILBOXES_FILE, []);
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
    writeJson(MAILBOXES_FILE, mailboxes);

    const { passwordHash, ...safe } = newMailbox;
    return safe;
  },

  verify(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const mailboxes = readJson(MAILBOXES_FILE, []);
    const mailbox = mailboxes.find(m => m.email.toLowerCase() === cleanEmail);
    if (!mailbox) return false;
    return mailbox.passwordHash === hashPassword(password);
  },

  delete(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    let mailboxes = readJson(MAILBOXES_FILE, []);
    mailboxes = mailboxes.filter(m => m.email.toLowerCase() !== cleanEmail);
    writeJson(MAILBOXES_FILE, mailboxes);
    return true;
  }
};
