import nodemailer from 'nodemailer';
import dns from 'dns';
import { storage } from './storage.js';

const dnsPromises = dns.promises;

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
      }
    });

    info = await transporter.sendMail(mailOptions);
  } else {
    // Mode 2: Direct delivery via recipient domain MX record or direct nodemailer transport
    console.log(`[Mailer] Resolving MX and sending direct email to: ${to}`);
    
    // Extract recipient domain
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
        console.warn(`[Mailer] Could not resolve MX for ${recipientDomain}, falling back to direct host or local:`, err.message);
      }
    }

    const transporter = nodemailer.createTransport({
      host: targetHost,
      port: targetPort,
      secure: false,
      name: settings.serverHost || 'localhost',
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      info = await transporter.sendMail(mailOptions);
    } catch (directErr) {
      // If direct delivery on port 25 fails (common in residential ISPs that block port 25 outbound),
      // we log a clear explanation and throw a helpful error
      console.error(`[Mailer] Direct delivery failed: ${directErr.message}`);
      throw new Error(
        `Failed to deliver directly to ${to} (${directErr.message}). ` +
        `Note: Most home ISPs block outbound port 25. You can configure an SMTP Relay in Settings (SendGrid, Mailgun, Brevo, or custom SMTP) for 100% reliable delivery.`
      );
    }
  }

  // Save the sent email to Sent folder
  const savedEmail = storage.saveEmail({
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
