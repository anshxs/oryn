import { SETTINGS_FILE, readJson, writeJson } from '../helpers/fileStorage.js';
import { getCachedPublicIp } from '../helpers/networkHelper.js';

const DEFAULT_SETTINGS = {
  domain: process.env.MAIL_DOMAIN || 'glennesports.app',
  serverHost: process.env.SERVER_HOST || 'mail.glennesports.app',
  serverIp: process.env.SERVER_IP || getCachedPublicIp(),
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

export const SettingsModel = {
  get() {
    return readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  },

  update(updates) {
    const current = this.get();
    const updated = {
      ...current,
      ...updates,
      relay: {
        ...current.relay,
        ...(updates.relay || {})
      }
    };
    writeJson(SETTINGS_FILE, updated);
    return updated;
  }
};
