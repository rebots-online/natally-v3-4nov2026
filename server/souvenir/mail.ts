// §7.5: the souvenir email over SMTP. A failure here never fails finalize; the caller leaves emailedAt null and a repeat retries.
import nodemailer from 'nodemailer';
import type { ServerConfigX } from '../core/index.ts';
import { fill, strings } from './strings.ts';

export async function sendSouvenirMail(cfg: ServerConfigX, to: string, name: string, links: { pdfUrl: string; atelierUrl: string }): Promise<void> {
  const { host, port, secure, user, password, from } = cfg.smtp;
  if (!host || !from) throw new Error('SMTP is not configured');
  const transport = nodemailer.createTransport({
    host, port, secure, ...(user ? { auth: { user, pass: password } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  try {
    await transport.sendMail({
      from, to,
      subject: fill(strings['mail.subject'], cfg.appName),
      text: fill(strings['mail.body'], name, links.atelierUrl, links.pdfUrl),
    });
  } finally {
    transport.close();
  }
}
