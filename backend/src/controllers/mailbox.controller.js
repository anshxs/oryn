import { MailboxModel } from '../models/mailbox.model.js';

export const MailboxController = {
  /**
   * GET /api/mailboxes
   */
  async getMailboxes(req, res) {
    try {
      const { domain } = req.query;
      const mailboxes = MailboxModel.getAll(domain);
      return res.status(200).json({ success: true, mailboxes });
    } catch (err) {
      console.error('[MailboxController.getMailboxes] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/mailboxes
   */
  async createMailbox(req, res) {
    try {
      const { email, username, domain, password, name } = req.body;
      const newMailbox = MailboxModel.create({ email, username, domain, password, name });

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('mailbox_created', newMailbox);
      }

      return res.status(201).json({ success: true, mailbox: newMailbox });
    } catch (err) {
      console.error('[MailboxController.createMailbox] Error:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/mailboxes/verify
   */
  async verifyMailbox(req, res) {
    try {
      const { email, password } = req.body;
      const valid = MailboxModel.verify(email, password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
      const mailbox = MailboxModel.getByEmail(email);
      const { passwordHash, ...safe } = mailbox;
      return res.status(200).json({ success: true, mailbox: safe });
    } catch (err) {
      console.error('[MailboxController.verifyMailbox] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * DELETE /api/mailboxes/:email
   */
  async deleteMailbox(req, res) {
    try {
      MailboxModel.delete(req.params.email);

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('mailbox_deleted', { email: req.params.email });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[MailboxController.deleteMailbox] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
