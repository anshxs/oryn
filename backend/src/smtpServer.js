import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { storage } from './storage.js';

export function createSmtpServer(onNewEmail) {
  const settings = storage.getSettings();

  const server = new SMTPServer({
    name: settings.serverHost || 'localhost',
    banner: `Oryn Mail Server ESMTP Ready`,
    // Allow unauthenticated incoming mail (standard MX behavior for receiving email)
    disabledCommands: ['AUTH'],
    authOptional: true,
    size: 25 * 1024 * 1024, // 25 MB max email size

    onConnect(session, callback) {
      console.log(`[SMTP] Inbound connection from ${session.remoteAddress}`);
      return callback(); // Accept connection
    },

    onMailFrom(address, session, callback) {
      console.log(`[SMTP] Mail from: ${address.address}`);
      return callback(); // Accept sender
    },

    onRcptTo(address, session, callback) {
      console.log(`[SMTP] Mail to: ${address.address}`);
      return callback(); // Accept recipient
    },

    async onData(stream, session, callback) {
      console.log(`[SMTP] Receiving message stream...`);

      try {
        const parsed = await simpleParser(stream);

        // Process attachments
        const attachments = [];
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const att of parsed.attachments) {
            const savedAtt = storage.saveAttachment(att.filename || 'attachment', att.content);
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

        // Save email to storage
        const savedEmail = storage.saveEmail({
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
          headers: Object.fromEntries(parsed.headers),
          rawSize: session.envelope?.size || 0
        });

        console.log(`[SMTP] Successfully stored email ID: ${savedEmail.id} from: ${savedEmail.from}`);

        if (typeof onNewEmail === 'function') {
          onNewEmail(savedEmail);
        }

        return callback(); // Message accepted
      } catch (err) {
        console.error(`[SMTP] Error parsing email stream:`, err);
        return callback(new Error('Failed to process message'));
      }
    }
  });

  server.on('error', (err) => {
    console.error(`[SMTP] Server error:`, err);
  });

  return server;
}
