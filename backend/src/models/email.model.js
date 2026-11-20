import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EMAILS_FILE, ATTACHMENTS_DIR, readJson, writeJson } from '../helpers/fileStorage.js';
import { DomainModel } from './domain.model.js';
import { MailboxModel } from './mailbox.model.js';

export const EmailModel = {
  find({ mailbox = '', folder = 'inbox', search = '' } = {}) {
    let emails = readJson(EMAILS_FILE, []);
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

  findById(id) {
    const emails = readJson(EMAILS_FILE, []);
    return emails.find(e => e.id === id) || null;
  },

  create(emailData) {
    const emails = readJson(EMAILS_FILE, []);
    
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
      security: emailData.security || { spf: 'none', dkim: 'none', dmarc: 'none', isSafe: true },
      rawSize: emailData.rawSize || 0
    };

    emails.unshift(newEmail);
    writeJson(EMAILS_FILE, emails);
    return newEmail;
  },

  updateById(id, updates) {
    const emails = readJson(EMAILS_FILE, []);
    const index = emails.findIndex(e => e.id === id);
    if (index === -1) return null;

    emails[index] = { ...emails[index], ...updates };
    writeJson(EMAILS_FILE, emails);
    return emails[index];
  },

  deleteById(id, permanent = false) {
    const emails = readJson(EMAILS_FILE, []);
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

    writeJson(EMAILS_FILE, emails);
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
    let emails = readJson(EMAILS_FILE, []);
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

    const domains = DomainModel.getAll();
    const mailboxes = MailboxModel.getAll();

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
