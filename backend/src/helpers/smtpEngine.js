import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { SettingsModel } from '../models/settings.model.js';
import { DomainModel } from '../models/domain.model.js';
import { EmailModel } from '../models/email.model.js';
import { analyzeSecurityHeaders } from './securityEngine.js';

/**
 * Initializes the RFC 5321 Inbound SMTP Server daemon.
 * Parses incoming MIME mail streams and dispatches emails into the Model layer.
 */
export function createSmtpServer(onNewEmail) {
  const settings = SettingsModel.get();

  const server = new SMTPServer({
    name: settings.serverHost || 'localhost',
    banner: `Oryn Mail Server ESMTP Ready`,
    disabledCommands: ['AUTH'],
    authOptional: true,
    size: 25 * 1024 * 1024, // 25 MB max email size

    onConnect(session, callback) {
      console.log(`[SMTP] Inbound connection from ${session.remoteAddress}`);
      return callback();
    },

    onMailFrom(address, session, callback) {
      console.log(`[SMTP] Mail from: ${address.address}`);
      return callback();
    },

    onRcptTo(address, session, callback) {
      const recipient = address.address.toLowerCase();
      const domain = recipient.split('@')[1];

      if (!domain) {
        return callback(new Error('501 5.1.3 Bad recipient address syntax'));
      }

      // Reject recipients for domains not explicitly hosted on this server
      // This strictly eliminates the Open Relay vulnerability.
      const isAllowed = DomainModel.isDomainAllowed(domain);
      if (!isAllowed) {
        console.warn(`[SMTP Security] Rejected open relay attempt to external domain "${domain}" from IP ${session.remoteAddress}`);
        return callback(new Error(`550 5.1.1 Recipient address rejected: Domain "${domain}" is not hosted on this server`));
      }

      console.log(`[SMTP] Mail to: ${recipient} (Domain ${domain} accepted)`);
      return callback();
    },

    async onData(stream, session, callback) {
      console.log(`[SMTP] Receiving message stream...`);

      try {
        const parsed = await simpleParser(stream);

        // Process attachments
        const attachments = [];
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const att of parsed.attachments) {
            const savedAtt = EmailModel.saveAttachment(att.filename || 'attachment', att.content);
            attachments.push({
              id: savedAtt.id,
              filename: att.filename || 'attachment',
              contentType: att.contentType,
              size: att.size || att.content.length,
              path: savedAtt.path
            });
          }
        }

        // Format sender and recipients
        const fromAddress = parsed.from ? (parsed.from.text || parsed.from.value[0]?.address) : 'unknown';
        const toAddress = parsed.to ? (parsed.to.text || parsed.to.value.map(v => v.address).join(', ')) : '';
        const ccAddress = parsed.cc ? (parsed.cc.text || parsed.cc.value.map(v => v.address).join(', ')) : '';

        // Target mailbox matching recipient
        const rcptEnvelope = session.envelope?.rcptTo?.[0]?.address?.toLowerCase();
        let targetMailbox = rcptEnvelope || '';
        if (!targetMailbox && toAddress) {
          const match = toAddress.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
          if (match) targetMailbox = match[0].toLowerCase();
        }

        const headersObj = Object.fromEntries(parsed.headers);
        // Independent DNS SPF and Cryptographic Header Security Validation
        const securityStatus = await analyzeSecurityHeaders(headersObj, fromAddress, session.remoteAddress);

        // Save email to model layer routed to target mailbox
        const savedEmail = EmailModel.create({
          mailbox: targetMailbox,
          folder: 'inbox',
          from: fromAddress,
          to: toAddress,
          cc: ccAddress,
          subject: parsed.subject || '(No Subject)',
          text: parsed.text || '',
          html: parsed.html || (parsed.textAsHtml || (parsed.text ? parsed.text.replace(/\n/g, '<br/>') : '')),
          date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
          read: false,
          attachments,
          headers: headersObj,
          security: securityStatus,
          rawSize: session.envelope?.size || 0
        });

        console.log(`[SMTP] Stored email ID: ${savedEmail.id} for mailbox: ${savedEmail.mailbox}`);

        if (typeof onNewEmail === 'function') {
          onNewEmail(savedEmail);
        }

        return callback();
      } catch (err) {
        console.error(`[SMTP] Error parsing email:`, err);
        return callback(new Error(`Error parsing message: ${err.message}`));
      }
    }
  });

  return server;
}
