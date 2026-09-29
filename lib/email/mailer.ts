import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
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

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return { transporter, config };
}
