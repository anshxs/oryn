import { SettingsModel } from './models/settings.model.js';
import { DomainModel } from './models/domain.model.js';
import { MailboxModel } from './models/mailbox.model.js';
import { EmailModel } from './models/email.model.js';
import { detectPublicIp } from './helpers/networkHelper.js';

export { detectPublicIp };

/**
 * Storage facade for backward compatibility
 * Delegating all operations to the new MVC Model layer.
 */
export const storage = {
  getSettings() { return SettingsModel.get(); },
  updateSettings(updates) { return SettingsModel.update(updates); },
  getDomains() { return DomainModel.getAll(); },
  addDomain(data) { return DomainModel.create(data); },
  updateDomain(name, updates) { return DomainModel.update(name, updates); },
  deleteDomain(name) { return DomainModel.delete(name); },
  isDomainAllowed(name) { return DomainModel.isDomainAllowed(name); },
  getMailboxes(domain) { return MailboxModel.getAll(domain); },
  getMailboxByEmail(email) { return MailboxModel.getByEmail(email); },
  createMailbox(data) { return MailboxModel.create(data); },
  verifyMailbox(email, pass) { return MailboxModel.verify(email, pass); },
  deleteMailbox(email) { return MailboxModel.delete(email); },
  getEmails(filter) { return EmailModel.find(filter); },
  getEmailById(id) { return EmailModel.findById(id); },
  saveEmail(data) { return EmailModel.create(data); },
  updateEmail(id, updates) { return EmailModel.updateById(id, updates); },
  deleteEmail(id, perm) { return EmailModel.deleteById(id, perm); },
  saveAttachment(name, buf) { return EmailModel.saveAttachment(name, buf); },
  getStats(mailbox) { return EmailModel.getStats(mailbox); }
};
