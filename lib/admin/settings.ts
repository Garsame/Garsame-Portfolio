import "server-only";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Settings, User } from "@/models";
import {
  bio as defaultBio,
  clients as defaultClients,
  contact as defaultContact,
  faq as defaultFaq,
  process as defaultProcess,
  services as defaultServices,
} from "@/lib/content/home";

export type AdminClient = {
  name: string;
  avatar: { id: string; url: string; originalName: string } | null;
};

export type AdminSettingsView = {
  bioShort: string;
  bioLong: string;
  phone: string;
  email: string;
  location: string;

  clients: AdminClient[];
  faq: { question: string; answer?: string; order: number }[];
  services: {
    title: string;
    description: string;
    icon: "screen" | "phone" | "chart" | "mail" | "automation" | "support";
    order: number;
  }[];
  processSteps: { title: string; description: string; order: number }[];

  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    hasPassword: boolean;
    fromName: string;
    fromEmail: string;
  };
};

export type SaveSettingsPayload = {
  bioShort: string;
  bioLong: string;
  phone: string;
  email: string;
  location: string;

  clients: { name: string; avatarId?: string | null }[];
  faq: { question: string; answer?: string; order: number }[];
  services: {
    title: string;
    description: string;
    icon: "screen" | "phone" | "chart" | "mail" | "automation" | "support";
    order: number;
  }[];
  processSteps: { title: string; description: string; order: number }[];

  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password?: string;
    fromName: string;
    fromEmail: string;
  };
};

export async function getSettingsData(): Promise<AdminSettingsView> {
  await dbConnect();
  const doc = await Settings.findOne({ key: "site" })
    .select("+smtp.passEncrypted")
    .populate<{
      clients: {
        name: string;
        avatar?: { _id: unknown; url: string; originalName: string };
      }[];
    }>("clients.avatar", "url originalName")
    .lean();

  const servicesList =
    doc?.services && doc.services.length > 0
      ? doc.services.map((s, idx) => ({
          title: s.title,
          description: s.description,
          icon: s.icon,
          order: s.order ?? idx + 1,
        }))
      : defaultServices.map((s, idx) => ({
          title: s.title,
          description: s.description,
          icon: "screen" as const,
          order: idx + 1,
        }));

  const stepsList =
    doc?.processSteps && doc.processSteps.length > 0
      ? doc.processSteps.map((p, idx) => ({
          title: p.title,
          description: p.description,
          order: p.order ?? idx + 1,
        }))
      : defaultProcess.steps.map((p, idx) => ({
          title: p.title,
          description: p.description,
          order: idx + 1,
        }));

  const faqList =
    doc?.faq && doc.faq.length > 0
      ? doc.faq.map((f, idx) => ({
          question: f.question,
          answer: f.answer || "",
          order: f.order ?? idx + 1,
        }))
      : defaultFaq.items.map((f, idx) => ({
          question: f.question,
          answer: f.answer || "",
          order: idx + 1,
        }));

  const clientsList: AdminClient[] =
    doc?.clients && doc.clients.length > 0
      ? doc.clients.map((c) => ({
          name: c.name,
          avatar: c.avatar
            ? {
                id: String(c.avatar._id),
                url: c.avatar.url,
                originalName: c.avatar.originalName,
              }
            : null,
        }))
      : defaultClients.map((c) => ({ ...c, avatar: null }));

  return {
    bioShort: doc?.bioShort || defaultBio.short,
    bioLong: doc?.bioLong || defaultBio.long,
    phone: doc?.phone || defaultContact.phone || "",
    email: doc?.email || defaultContact.email || "",
    location: doc?.location || defaultContact.location || "Mogadishu, Somalia",

    clients: clientsList,
    faq: faqList,
    services: servicesList,
    processSteps: stepsList,

    smtp: {
      host: doc?.smtp?.host || process.env.SMTP_HOST || "",
      port: doc?.smtp?.port || Number(process.env.SMTP_PORT) || 587,
      secure: doc?.smtp?.secure ?? process.env.SMTP_SECURE === "true",
      user: doc?.smtp?.user || process.env.SMTP_USER || "",
      hasPassword: Boolean(
        doc?.smtp?.passEncrypted || process.env.SMTP_PASSWORD,
      ),
      fromName:
        doc?.smtp?.fromName || process.env.SMTP_FROM_NAME || "Garsame Mohamud",
      fromEmail:
        doc?.smtp?.fromEmail ||
        process.env.SMTP_FROM_EMAIL ||
        "garsame@example.com",
    },
  };
}

export async function saveSettingsData(
  payload: SaveSettingsPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    let doc = await Settings.findOne({ key: "site" });
    if (!doc) {
      doc = new Settings({ key: "site" });
    }

    doc.bioShort = payload.bioShort.trim().slice(0, 300);
    doc.bioLong = payload.bioLong.trim().slice(0, 5000);
    doc.phone = payload.phone.trim().slice(0, 40);
    doc.email = payload.email.trim().toLowerCase();
    doc.location = payload.location.trim().slice(0, 120);

    doc.clients = payload.clients
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        avatar: c.avatarId ? new Types.ObjectId(c.avatarId) : undefined,
      }));

    doc.faq = payload.faq
      .filter((f) => f.question.trim())
      .map((f, idx) => ({
        question: f.question.trim(),
        answer: f.answer ? f.answer.trim() : undefined,
        order: f.order ?? idx + 1,
      }));

    doc.services = payload.services
      .filter((s) => s.title.trim())
      .map((s, idx) => ({
        title: s.title.trim(),
        description: s.description.trim(),
        icon: s.icon,
        order: s.order ?? idx + 1,
      }));

    doc.processSteps = payload.processSteps
      .filter((p) => p.title.trim())
      .map((p, idx) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        order: p.order ?? idx + 1,
      }));

    doc.smtp = {
      host: payload.smtp.host.trim() || undefined,
      port: payload.smtp.port || 587,
      secure: Boolean(payload.smtp.secure),
      user: payload.smtp.user.trim() || undefined,
      fromName: payload.smtp.fromName.trim() || undefined,
      fromEmail: payload.smtp.fromEmail.trim().toLowerCase() || undefined,
      passEncrypted: payload.smtp.password
        ? payload.smtp.password // in Phase 10 this gets encrypted with SETTINGS_ENCRYPTION_KEY
        : doc.smtp?.passEncrypted,
    };

    await doc.save();

    /* Revalidate public pages */
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/services");
    revalidatePath("/projects");
    revalidatePath("/blog");
    revalidatePath("/contact");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (err) {
    console.error("[settings:save]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not save settings.",
    };
  }
}

export async function testSmtpConnection(config?: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
}): Promise<{ success: boolean; message: string }> {
  if (!config?.host || !config?.user) {
    return {
      success: false,
      message: "SMTP host and username are required to test connection.",
    };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const { renderTestEmail } = await import("@/lib/email/templates");
    const { sendLoggedMail } = await import("@/lib/email/logger");

    // If password wasn't passed in preview, retrieve existing saved encrypted password
    let pass = config.password;
    if (!pass) {
      await dbConnect();
      const existing = await Settings.findOne({ key: "site" }).lean();
      pass = existing?.smtp?.passEncrypted || "";
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });

    await transporter.verify();

    const timestamp = new Date().toLocaleString("en-GB", {
      timeZone: "Africa/Mogadishu",
    });

    const testTpl = renderTestEmail({
      host: config.host,
      port: config.port,
      user: config.user,
      timestamp: `${timestamp} EAT`,
    });

    const sendRes = await sendLoggedMail({
      type: "test",
      to: config.fromEmail || config.user,
      subject: testTpl.subject,
      html: testTpl.html,
      text: testTpl.text,
    });

    if (!sendRes.success) {
      return {
        success: false,
        message: `SMTP verified, but failed to send test email: ${sendRes.error}`,
      };
    }

    return {
      success: true,
      message: `Connection successful! Test email sent to ${config.fromEmail || config.user} and logged in mail database.`,
    };
  } catch (err) {
    console.error("[settings:testSmtp]", err);
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to connect to SMTP server.",
    };
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 12) {
    return {
      success: false,
      error: "New password must be at least 12 characters long.",
    };
  }

  await dbConnect();
  const admin = await User.findOne().select("+passwordHash");
  if (!admin) {
    return { success: false, error: "Admin account not found." };
  }

  const valid = await admin.checkPassword(currentPassword);
  if (!valid) {
    return { success: false, error: "The current password is incorrect." };
  }

  await admin.setPassword(newPassword);
  await admin.save();

  return { success: true };
}
