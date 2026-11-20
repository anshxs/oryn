import { v4 as uuidv4 } from 'uuid';
import { DOMAINS_FILE, MAILBOXES_FILE, readJson, writeJson } from '../helpers/fileStorage.js';
import { SettingsModel } from './settings.model.js';
import { getCachedPublicIp } from '../helpers/networkHelper.js';

export const DomainModel = {
  getAll() {
    let domains = readJson(DOMAINS_FILE, []);
    let modified = false;

    if (!domains || domains.length === 0 || !domains[0]?.name) {
      const settings = SettingsModel.get();
      const initialDomain = settings.domain || 'glennesports.app';
      const ip = (settings.serverIp && settings.serverIp !== '127.0.0.1') ? settings.serverIp : getCachedPublicIp();
      domains = [{
        id: uuidv4(),
        name: initialDomain,
        serverHost: settings.serverHost || `mail.${initialDomain}`,
        serverIp: ip,
        createdAt: new Date().toISOString(),
        verified: false
      }];
      modified = true;
    } else {
      // Migrate any legacy 127.0.0.1 entries to real IP
      domains = domains.map(d => {
        if (!d.serverIp || d.serverIp === '127.0.0.1') {
          modified = true;
          return { ...d, serverIp: getCachedPublicIp() };
        }
        return d;
      });
    }

    if (modified) {
      writeJson(DOMAINS_FILE, domains);
    }
    return domains;
  },

  getByName(domainName) {
    if (!domainName) return null;
    const clean = domainName.trim().toLowerCase();
    const domains = this.getAll();
    return domains.find(d => (d.name || '').toLowerCase() === clean) || null;
  },

  create({ name, serverHost, serverIp }) {
    const domains = this.getAll();
    const cleanName = (name || '').trim().toLowerCase();
    if (!cleanName) throw new Error('Domain name cannot be empty.');

    if (domains.some(d => (d.name || '').toLowerCase() === cleanName)) {
      throw new Error(`Domain "${cleanName}" is already registered.`);
    }

    const settings = SettingsModel.get();
    const realIp = (serverIp && serverIp.trim() !== '127.0.0.1')
      ? serverIp.trim()
      : (settings.serverIp && settings.serverIp !== '127.0.0.1' ? settings.serverIp : getCachedPublicIp());

    const newDomain = {
      id: uuidv4(),
      name: cleanName,
      serverHost: (serverHost || `mail.${cleanName}`).trim().toLowerCase(),
      serverIp: realIp,
      createdAt: new Date().toISOString(),
      verified: false
    };

    domains.push(newDomain);
    writeJson(DOMAINS_FILE, domains);
    return newDomain;
  },

  update(domainName, updates) {
    const cleanName = (domainName || '').trim().toLowerCase();
    let domains = this.getAll();
    const idx = domains.findIndex(d => (d.name || '').toLowerCase() === cleanName);
    if (idx === -1) throw new Error(`Domain ${cleanName} not found.`);

    domains[idx] = { ...domains[idx], ...updates };
    writeJson(DOMAINS_FILE, domains);
    return domains[idx];
  },

  delete(domainName) {
    const cleanName = (domainName || '').trim().toLowerCase();
    let domains = this.getAll();
    domains = domains.filter(d => (d.name || '').toLowerCase() !== cleanName);
    writeJson(DOMAINS_FILE, domains);

    // Cascade delete mailboxes belonging to this domain
    let mailboxes = readJson(MAILBOXES_FILE, []);
    mailboxes = mailboxes.filter(m => (m.domain || '').toLowerCase() !== cleanName);
    writeJson(MAILBOXES_FILE, mailboxes);

    return true;
  },

  isDomainAllowed(domainName) {
    if (!domainName) return false;
    const cleanName = domainName.trim().toLowerCase();
    const domains = this.getAll();
    return domains.some(d => (d.name || '').toLowerCase() === cleanName);
  }
};
