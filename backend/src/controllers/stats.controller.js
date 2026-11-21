import { EmailModel } from '../models/email.model.js';
import { SettingsModel } from '../models/settings.model.js';
import { detectPublicIp } from '../helpers/networkHelper.js';

function sanitizeSettings(settings) {
  if (!settings) return settings;
  const sanitized = { ...settings };
  if (sanitized.relay) {
    sanitized.relay = {
      ...sanitized.relay,
      hasPass: Boolean(sanitized.relay.pass),
      pass: sanitized.relay.pass ? '••••••••' : ''
    };
  }
  return sanitized;
}

export const StatsController = {
  /**
   * GET /api/stats
   */
  async getStats(req, res) {
    try {
      const { mailbox } = req.query;
      const stats = EmailModel.getStats(mailbox);
      const settings = SettingsModel.get();
      return res.status(200).json({
        success: true,
        stats,
        server: {
          smtpPort: settings.smtpPort,
          outboundMode: settings.outboundMode,
          uptime: process.uptime()
        }
      });
    } catch (err) {
      console.error('[StatsController.getStats] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/public-ip
   */
  async getPublicIp(req, res) {
    try {
      const ip = await detectPublicIp();
      return res.status(200).json({ success: true, ip });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message, ip: '115.244.141.202' });
    }
  },

  /**
   * GET /api/settings
   * Returns application settings with credentials strictly masked.
   */
  async getSettings(req, res) {
    try {
      const settings = SettingsModel.get();
      return res.status(200).json({ success: true, settings: sanitizeSettings(settings) });
    } catch (err) {
      console.error('[StatsController.getSettings] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/settings
   */
  async updateSettings(req, res) {
    try {
      const updated = SettingsModel.update(req.body);
      const sanitized = sanitizeSettings(updated);
      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('settings_updated', sanitized);
      }
      return res.status(200).json({ success: true, settings: sanitized });
    } catch (err) {
      console.error('[StatsController.updateSettings] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
