import path from 'path';
import fs from 'fs';
import { EmailModel } from '../models/email.model.js';
import { sendEmail as mailerSend } from '../helpers/mailerEngine.js';
import { ATTACHMENTS_DIR } from '../helpers/fileStorage.js';

export const EmailController = {
  /**
   * GET /api/emails
   * Query params: mailbox, folder, search
   */
  async getEmails(req, res) {
    try {
      const { mailbox, folder, search } = req.query;
      const emails = EmailModel.find({ mailbox, folder, search });
      return res.status(200).json({ success: true, emails });
    } catch (err) {
      console.error('[EmailController.getEmails] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/emails/:id
   */
  async getEmailById(req, res) {
    try {
      const email = EmailModel.findById(req.params.id);
      if (!email) {
        return res.status(404).json({ success: false, error: 'Email not found.' });
      }
      return res.status(200).json({ success: true, email });
    } catch (err) {
      console.error('[EmailController.getEmailById] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/emails/send
   */
  async sendEmail(req, res) {
    try {
      const { from, to, cc, bcc, subject, text, html, attachments } = req.body;
      if (!to || !to.trim()) {
        return res.status(400).json({ success: false, error: 'Recipient address is required.' });
      }
      if (!from || !from.trim()) {
        return res.status(400).json({ success: false, error: 'Sender mailbox ("from") is required.' });
      }

      const result = await mailerSend({ from, to, cc, bcc, subject, text, html, attachments });

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('email_sent', result.savedEmail);
      }

      return res.status(200).json({
        success: true,
        message: 'Email dispatched successfully.',
        email: result.savedEmail
      });
    } catch (err) {
      console.error('[EmailController.sendEmail] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * POST /api/emails/simulate
   * Simulates an inbound email for testing and demonstrations
   */
  async simulateEmail(req, res) {
    try {
      const { mailbox, from, to, subject, text, html } = req.body;
      const targetMailbox = (mailbox || to || 'ansh@example.com').toLowerCase();

      const simulatedEmail = EmailModel.create({
        mailbox: targetMailbox,
        folder: 'inbox',
        from: from || `customer@clientdomain.com`,
        to: to || targetMailbox,
        subject: subject || `Welcome to ${targetMailbox}!`,
        text: text || `This is a test inbound email sent to your custom address ${targetMailbox}.`,
        html: html || `<p>This is a <strong>test inbound email</strong> sent to your mailbox <code>${targetMailbox}</code>.</p>`,
        date: new Date().toISOString(),
        read: false,
        starred: false
      });

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('new_email', simulatedEmail);
      }

      return res.status(201).json({ success: true, email: simulatedEmail });
    } catch (err) {
      console.error('[EmailController.simulateEmail] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * PATCH /api/emails/:id
   */
  async updateEmail(req, res) {
    try {
      const updated = EmailModel.updateById(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Email not found.' });
      }

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('email_updated', updated);
      }

      return res.status(200).json({ success: true, email: updated });
    } catch (err) {
      console.error('[EmailController.updateEmail] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * DELETE /api/emails/:id
   */
  async deleteEmail(req, res) {
    try {
      const permanent = req.query.permanent === 'true';
      const success = EmailModel.deleteById(req.params.id, permanent);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Email not found.' });
      }

      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('email_deleted', { id: req.params.id, permanent });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[EmailController.deleteEmail] Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * GET /api/attachments/:fileId
   */
  async downloadAttachment(req, res) {
    try {
      const { fileId } = req.params;
      const filePath = path.join(ATTACHMENTS_DIR, fileId);

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Attachment not found.');
      }

      return res.download(filePath);
    } catch (err) {
      console.error('[EmailController.downloadAttachment] Error:', err);
      return res.status(500).send(err.message);
    }
  }
};
