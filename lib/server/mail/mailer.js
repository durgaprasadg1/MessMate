/**
 * Mail delivery behind a one-method interface (Interface Segregation +
 * Dependency Inversion). Routes call `getMailer().send(...)` and never import
 * nodemailer directly, so tests inject a fake and the provider can change
 * without touching any route.
 */
import nodemailer from "nodemailer";
import logger from "../logging/logger.js";
import { getEnv } from "../config/env.js";

/** @typedef {{ send(message: { to: string, subject: string, html: string }): Promise<void> }} Mailer */

/** @implements {Mailer} */
export class NodemailerMailer {
  constructor(env = getEnv()) {
    this.from = `"MessMate Support" <${env.MAIL_USER}>`;
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
    });
  }

  async send({ to, subject, html }) {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}

/** Collects messages instead of sending them (tests / local dev without SMTP). */
export class MemoryMailer {
  constructor() {
    this.sent = [];
  }
  async send(message) {
    this.sent.push(message);
  }
}

let mailer = null;
export const getMailer = () => (mailer ??= new NodemailerMailer());
export const setMailer = (m) => {
  mailer = m;
};

/**
 * Best-effort send: delivery problems are logged (without the body) and never
 * break the request that triggered the mail. Returns true when sent.
 */
export async function sendMailSafe(message, log = logger) {
  try {
    await getMailer().send(message);
    return true;
  } catch (err) {
    log.error("Failed to send e-mail", { err, subject: message?.subject });
    return false;
  }
}
