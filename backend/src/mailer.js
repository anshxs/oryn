import nodemailer from 'nodemailer';
import dns from 'dns';
import { storage } from './storage.js';

const dnsPromises = dns.promises;

/**
 * Tests an SMTP relay configuration and verifies credentials.
 */
export async function testRelayConnection({ host, port, secure, user, pass }) {
  if (!host) throw new Error('Relay host is required.');

  const transporter = nodemailer.createTransport({
    host: host.trim(),
    port: parseInt(port || '587', 10),
    secure: !!secure,
    auth: (user && pass) ? {
      user: user.trim(),
      pass: pass.trim()
    } : undefined,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 7000
  });

  return await transporter.verify();
}

/**
 * Sends an email either directly to the recipient's MX server or through an SMTP Relay.
 */
export async function sendEmail({ from, to, cc, bcc, subject, text, html, attachments = [] }) {
  const settings = storage.getSettings();
  const fromAddress = from || settings.defaultFromAddress || `admin@${settings.domain}`;

  // Process attachments for nodemailer
  const mailerAttachments = attachments.map(att => {
    if (att.content && typeof att.content === 'string') {
      return {
        filename: att.filename,
        content: att.content,
        encoding: att.encoding || 'utf-8',
        contentType: att.contentType
      };
    } else if (att.path) {
      return {
        filename: att.filename,
        path: att.path,
        contentType: att.contentType
      };
    }
    return att;
  });

  const mailOptions = {
    from: fromAddress,
    to,
    cc,
    bcc,
    subject,
    text,
    html: html || (text ? text.replace(/\n/g, '<br/>') : ''),
    attachments: mailerAttachments
  };

  let info;

  if (settings.outboundMode === 'relay' && settings.relay && settings.relay.host) {
    // Mode 1: Relay via configured SMTP provider
    console.log(`[Mailer] Sending via SMTP relay: ${settings.relay.host}:${settings.relay.port}`);
    const transporter = nodemailer.createTransport({
      host: settings.relay.host,
      port: settings.relay.port || 587,
      secure: settings.relay.secure || false,
      auth: (settings.relay.user && settings.relay.pass) ? {
        user: settings.relay.user,
        pass: settings.relay.pass
      } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000
    });

    info = await transporter.sendMail(mailOptions);
  } else {
    // Mode 2: Direct delivery via recipient domain MX record
    console.log(`[Mailer] Resolving MX and sending direct email to: ${to}`);
    
    const recipientDomain = to.split('@')[1];
    let targetHost = 'localhost';
    let targetPort = 25;

    if (recipientDomain) {
      try {
        const mxRecords = await dnsPromises.resolveMx(recipientDomain);
        if (mxRecords && mxRecords.length > 0) {
          mxRecords.sort((a, b) => a.priority - b.priority);
          targetHost = mxRecords[0].exchange;
          console.log(`[Mailer] Found MX for ${recipientDomain}: ${targetHost} (priority ${mxRecords[0].priority})`);
        }
      } catch (err) {
        console.warn(`[Mailer] Could not resolve MX for ${recipientDomain}:`, err.message);
      }
    }

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: targetPort,
      secure: false,
      name: settings.serverHost || 'localhost',
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 6000
    });

    try {
      info = await transporter.sendMail(mailOptions);
    } catch (directErr) {
      console.error(`[Mailer] Direct delivery failed: ${directErr.message}`);
      throw new Error(
        `Failed to deliver directly to ${to} (${directErr.message}). ` +
        `Your residential ISP is blocking outbound TCP Port 25. ` +
        `Go to "Domains & Accounts" -> "3. Outbound Delivery" in the app, select "SMTP Relay" and enter your Gmail, Brevo, or SendGrid credentials to send external mail reliably.`
      );
    }
  }

  // Save the sent email to Sent folder
  const savedEmail = storage.saveEmail({
    mailbox: fromAddress.toLowerCase(),
    folder: 'sent',
    from: fromAddress,
    to,
    cc,
    bcc,
    subject,
    text,
    html: mailOptions.html,
    date: new Date().toISOString(),
    read: true,
    attachments: attachments.map(a => ({
      filename: a.filename,
      size: a.size || (a.content ? a.content.length : 0),
      contentType: a.contentType
    }))
  });

  return { info, savedEmail };
}
