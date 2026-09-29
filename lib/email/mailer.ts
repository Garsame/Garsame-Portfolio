import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { dbConnect } from "@/lib/db";
import { Settings } from "@/models";

export type ResolvedSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  adminNotifyEmail: string;
  isConfigured: boolean;
};

/**
 * Resolves current SMTP configuration from database Settings document,
 * falling back to environment variables.
 */
export async function getResolvedSmtpConfig(): Promise<ResolvedSmtpConfig> {
  await dbConnect();
  const settingsDoc = await Settings.findOne({ key: "site" }).lean();

  const dbSmtp = settingsDoc?.smtp;
  const dbEmail = settingsDoc?.email;

  const host = dbSmtp?.host || process.env.SMTP_HOST || "";
  const port = dbSmtp?.port || Number(process.env.SMTP_PORT) || 587;
  const secure =
    typeof dbSmtp?.secure === "boolean"
      ? dbSmtp.secure
      : process.env.SMTP_SECURE === "true" || port === 465;
  const user = dbSmtp?.user || process.env.SMTP_USER || "";
  const pass = dbSmtp?.passEncrypted || process.env.SMTP_PASSWORD || "";
  const fromEmail =
    dbSmtp?.fromEmail ||
    process.env.SMTP_FROM_EMAIL ||
    dbEmail ||
    "garsame40@gmail.com";
  const fromName =
    dbSmtp?.fromName || process.env.SMTP_FROM_NAME || "Garsame Mohamud";
  const adminNotifyEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    dbEmail ||
    fromEmail ||
    "garsame40@gmail.com";

  const isConfigured = Boolean(host && user);

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    adminNotifyEmail,
    isConfigured,
  };
}

/**
 * Creates a Nodemailer Transporter based on resolved SMTP config.
 */
export async function getMailTransporter(): Promise<{
  transporter: Transporter;
  config: ResolvedSmtpConfig;
}> {
  const config = await getResolvedSmtpConfig();

  if (!config.isConfigured) {
    /* If unconfigured, create a mock / json transport or sendmail fallback in dev */
    const testTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return { transporter: testTransporter, config };
  }

  /* nodemailer's own types don't declare `family`, though it passes
     straight through to Node's net.connect, which does support it — a
     typed local variable (rather than an inline literal) sidesteps
     TypeScript's excess-property check on the object literal. */
  const transportOptions: SMTPTransport.Options & { family?: 4 | 6 } = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    /* Node's DNS lookup can hand a connection an IPv6 address that a
       network advertises but doesn't actually route — the socket then
       hangs until connectionTimeout instead of failing fast, even though a
       plain IPv4 connection to the same host works. Forcing IPv4 skips that
       entirely. */
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
  const transporter = nodemailer.createTransport(transportOptions);

  return { transporter, config };
}
