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
    const relayUpdates = { ...(updates.relay || {}) };

    // Prevent clobbering existing SMTP relay password when masked value or undefined is sent
    if (relayUpdates.pass === '••••••••' || relayUpdates.pass === undefined) {
      if (current.relay && current.relay.pass) {
        relayUpdates.pass = current.relay.pass;
      }
    }

    const updated = {
      ...current,
      ...updates,
      relay: {
        ...current.relay,
        ...relayUpdates
      }
    };
    writeJson(SETTINGS_FILE, updated);
    return updated;
  }
};
