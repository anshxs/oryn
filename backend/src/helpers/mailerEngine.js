import nodemailer from 'nodemailer';
import dns from 'dns';
import { SettingsModel } from '../models/settings.model.js';
import { EmailModel } from '../models/email.model.js';

const dnsPromises = dns.promises;

/**
 * Validates connection to an external SMTP relay provider.
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
  const settings = SettingsModel.get();
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
          console.log(`[Mailer] Found MX for ${recipientDomain}: ${targetHost}`);
        }
      } catch (err) {
        console.warn(`[Mailer] Could not resolve MX for ${recipientDomain}: ${err.message}. Trying direct host.`);
      }
    }

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: targetPort,
      secure: false,
      ignoreTLS: true,
      name: settings.serverHost || 'mail.glennesports.app',
      connectionTimeout: 8000
    });

    try {
      info = await transporter.sendMail(mailOptions);
    } catch (directErr) {
      // If direct port 25 fails (common in residential ISPs), fallback to relay if credentials exist
      if (settings.relay && settings.relay.host && settings.relay.user && settings.relay.pass) {
        console.log(`[Mailer] Direct delivery failed (${directErr.message}), falling back to SMTP relay...`);
        const fallbackTransporter = nodemailer.createTransport({
          host: settings.relay.host,
          port: settings.relay.port || 587,
          secure: settings.relay.secure || false,
          auth: {
            user: settings.relay.user,
            pass: settings.relay.pass
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000
        });
        info = await fallbackTransporter.sendMail(mailOptions);
      } else {
        throw new Error(`Failed to deliver directly to ${to} (${directErr.message}). Note: Most home ISPs block outbound port 25. You can configure an SMTP Relay in Settings (SendGrid, Mailgun, Brevo, or custom SMTP) for 100% reliable delivery.`);
      }
    }
  }

  // Save the sent email in the Sent folder
  const savedEmail = EmailModel.create({
    mailbox: fromAddress.toLowerCase(),
    folder: 'sent',
    from: fromAddress,
    to,
    cc,
    bcc,
    subject,
    text,
    html: html || (text ? text.replace(/\n/g, '<br/>') : ''),
    date: new Date().toISOString(),
    read: true,
    attachments: attachments.map(a => ({
      filename: a.filename,
      contentType: a.contentType,
      size: a.size || 0
    }))
  });

  return { info, savedEmail };
}
