import "server-only";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Broadcast, MailLog, Member } from "@/models";
import { getMailTransporter } from "./mailer";
import type { EditorNode } from "@/lib/editor-content";
import { isEditorDoc, plainText } from "@/lib/editor-content";

export type RenderBroadcastOptions = {
  subject: string;
  previewText?: string;
  bodyJson?: unknown;
  memberName?: string;
  unsubToken?: string;
  siteUrl?: string;
};

/**
 * Escapes HTML characters in text nodes.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts a TipTap document node to inline-styled HTML for email clients.
 */
export function renderTipTapToEmailHtml(doc: unknown): string {
  if (!isEditorDoc(doc)) return "";

  const renderNode = (node: EditorNode): string => {
    // 1. Text node with potential marks
    if (node.type === "text" && node.text) {
      let content = escapeHtml(node.text);
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") {
            content = `<strong>${content}</strong>`;
          } else if (mark.type === "italic") {
            content = `<em>${content}</em>`;
          } else if (mark.type === "code") {
            content = `<code style="font-family: 'IBM Plex Mono', monospace, Consolas, Courier; font-size: 13px; background-color: #EDF0FE; color: #3D5AF1; padding: 2px 5px; border-radius: 4px;">${content}</code>`;
          } else if (mark.type === "link" && mark.attrs?.href) {
            content = `<a href="${escapeHtml(String(mark.attrs.href))}" style="color: #3D5AF1; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${content}</a>`;
          }
        }
      }
      return content;
    }

    // 2. Hard break
    if (node.type === "hardBreak") {
      return "<br />";
    }

    // 3. Child contents
    const innerHtml = (node.content ?? []).map(renderNode).join("");

    // 4. Block containers
    switch (node.type) {
      case "doc":
        return innerHtml;

      case "paragraph":
        return `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.75; color: #2B3453;">${innerHtml || "&nbsp;"}</p>`;

      case "heading": {
        const level = Number(node.attrs?.level) || 2;
        const fontSize = level === 3 ? "17px" : "20px";
        return `<h${level} style="margin: 24px 0 12px; font-size: ${fontSize}; font-weight: 700; color: #0E1533; letter-spacing: -0.02em;">${innerHtml}</h${level}>`;
      }

      case "blockquote":
        return `<blockquote style="margin: 20px 0; padding: 14px 20px; border-left: 3px solid #3D5AF1; background-color: #F8FAFF; color: #2B3453; font-style: italic; border-radius: 0 8px 8px 0; font-size: 15px; line-height: 1.7;">${innerHtml}</blockquote>`;

      case "callout":
        return `<div style="margin: 20px 0; padding: 16px 20px; background-color: #F5F7FE; border-left: 3px solid #3D5AF1; border-radius: 0 10px 10px 0; font-size: 15px; line-height: 1.7; color: #2B3453;">${innerHtml}</div>`;

      case "codeBlock":
        return `<pre style="margin: 20px 0; padding: 14px 18px; background-color: #0E1533; color: #E4E8F7; font-family: 'IBM Plex Mono', monospace, Consolas, Courier; font-size: 13px; line-height: 1.6; border-radius: 8px; overflow-x: auto;"><code>${innerHtml}</code></pre>`;

      case "bulletList":
        return `<ul style="margin: 0 0 16px; padding-left: 22px; color: #2B3453;">${innerHtml}</ul>`;

      case "orderedList":
        return `<ol style="margin: 0 0 16px; padding-left: 22px; color: #2B3453;">${innerHtml}</ol>`;

      case "listItem":
        return `<li style="margin-bottom: 6px; font-size: 15px; line-height: 1.7;">${innerHtml}</li>`;

      case "horizontalRule":
        return `<hr style="margin: 28px 0; border: none; border-top: 1px solid #E4E8F7;" />`;

      case "image": {
        const src = node.attrs?.src ? escapeHtml(String(node.attrs.src)) : "";
        const alt = node.attrs?.alt ? escapeHtml(String(node.attrs.alt)) : "";
        const caption = node.attrs?.caption
          ? escapeHtml(String(node.attrs.caption))
          : "";
        if (!src) return "";
        return `
          <div style="margin: 22px 0; text-align: center;">
            <img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #E4E8F7;" />
            ${caption ? `<div style="margin-top: 6px; font-size: 12px; color: #7D89AE; font-style: italic;">${caption}</div>` : ""}
          </div>
        `;
      }

      default:
        return innerHtml;
    }
  };

  return renderNode(doc);
}

/**
 * Renders a full broadcast email with preview text, header, body, and unsubscribe link.
 */
export function renderBroadcastEmail({
  subject,
  previewText,
  bodyJson,
  memberName,
  unsubToken,
  siteUrl = process.env.NEXTAUTH_URL || "https://garsame.so",
}: RenderBroadcastOptions): { subject: string; html: string; text: string } {
  const contentHtml = renderTipTapToEmailHtml(bodyJson);
  const plainBody = plainText(bodyJson);

  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  const unsubUrl = unsubToken
    ? `${cleanSiteUrl}/unsubscribe?token=${encodeURIComponent(unsubToken)}`
    : `${cleanSiteUrl}/membership`;

  const previewSnippet = previewText
    ? `<div style="display: none; max-height: 0px; overflow: hidden;">${escapeHtml(previewText)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #F5F7FE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0E1533; -webkit-font-smoothing: antialiased;">
  ${previewSnippet}
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E4E8F7; overflow: hidden; box-shadow: 0 4px 16px rgba(14,21,51,0.04);">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 32px; border-bottom: 1px solid #EEF1FB; background-color: #FFFFFF;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="font-weight: 800; font-size: 19px; letter-spacing: -0.03em; color: #0E1533;">GARSAME</span>
              <span style="font-family: monospace; font-weight: 600; font-size: 11px; color: #FFFFFF; background-color: #3D5AF1; padding: 3px 6px; border-radius: 4px; margin-left: 6px;">v3</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Subject Header -->
    <tr>
      <td style="padding: 28px 32px 16px; border-bottom: 1px solid #F8FAFF;">
        <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; line-height: 1.3; color: #0E1533; letter-spacing: -0.02em;">${escapeHtml(subject)}</h1>
        ${previewText ? `<div style="font-size: 14px; color: #64708F; line-height: 1.5;">${escapeHtml(previewText)}</div>` : ""}
      </td>
    </tr>
    <!-- Main Content -->
    <tr>
      <td style="padding: 24px 32px 32px; font-size: 15px; line-height: 1.75; color: #2B3453;">
        ${memberName ? `<p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0E1533;">Hi ${escapeHtml(memberName)},</p>` : ""}
        ${contentHtml}
      </td>
    </tr>
    <!-- Author Signoff -->
    <tr>
      <td style="padding: 0 32px 28px;">
        <div style="border-top: 1px solid #EEF1FB; padding-top: 20px; font-size: 13px; color: #64708F;">
          Best regards,<br>
          <strong style="color: #0E1533;">Garsame Mohamud</strong><br>
          <span style="color: #97A2C0;">Mogadishu, Somalia</span>
        </div>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #F8FAFF; border-top: 1px solid #EEF1FB; font-size: 12px; line-height: 1.6; color: #7D89AE;">
        You received this update because you are an active member on <a href="${cleanSiteUrl}" style="color: #3D5AF1; text-decoration: underline;">garsame.so</a>.
        <br>
        <a href="${unsubUrl}" style="color: #7D89AE; text-decoration: underline; margin-top: 4px; display: inline-block;">Unsubscribe with one click</a>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${subject}\n${previewText ? `${previewText}\n\n` : "\n"}${plainBody}\n\n---\nBest regards,\nGarsame Mohamud\nMogadishu, Somalia\n\nUnsubscribe: ${unsubUrl}`;

  return { subject, html, text };
}

/**
 * Dispatches a broadcast campaign to all active members with strict rate throttling
 * and individual MailLog creation (CLAUDE.md Rule 5).
 */
export async function dispatchBroadcast(
  broadcastId: string,
): Promise<{ ok: boolean; delivered: number; failed: number; message?: string }> {
  await dbConnect();

  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast) {
    return { ok: false, delivered: 0, failed: 0, message: "Broadcast not found." };
  }

  if (broadcast.state === "sent" || broadcast.state === "sending") {
    return {
      ok: false,
      delivered: broadcast.deliveredCount,
      failed: broadcast.failedCount,
      message: "This broadcast has already been sent or is currently sending.",
    };
  }

  // 1. Fetch active members
  const activeMembers = await Member.find({ status: "active" })
    .select("firstName email unsubToken")
    .lean<{ _id: Types.ObjectId; firstName: string; email: string; unsubToken: string }[]>();

  if (activeMembers.length === 0) {
    broadcast.state = "sent";
    broadcast.sentAt = new Date();
    broadcast.recipientCount = 0;
    await broadcast.save();
    return { ok: true, delivered: 0, failed: 0, message: "No active members to send to." };
  }

  // 2. Mark state as sending
  broadcast.state = "sending";
  broadcast.recipientCount = activeMembers.length;
  broadcast.deliveredCount = 0;
  broadcast.failedCount = 0;
  await broadcast.save();

  const { transporter, config } = await getMailTransporter();
  const fromAddress = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail;

  let deliveredCount = 0;
  let failedCount = 0;

  // 3. Process each recipient sequentially or in small batches with rate control
  for (const member of activeMembers) {
    const { html, text } = renderBroadcastEmail({
      subject: broadcast.subject,
      previewText: broadcast.previewText,
      bodyJson: broadcast.body,
      memberName: member.firstName,
      unsubToken: member.unsubToken,
    });

    // Rule 5: Write queued MailLog entry before dispatch
    const logDoc = await MailLog.create({
      type: "broadcast",
      broadcast: broadcast._id,
      to: member.email.toLowerCase().trim(),
      subject: broadcast.subject,
      status: "queued",
      attempts: 0,
    });

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: member.email,
        subject: broadcast.subject,
        html,
        text,
      });

      // Update log
      logDoc.status = "sent";
      logDoc.sentAt = new Date();
      logDoc.attempts = 1;
      logDoc.error = undefined;
      await logDoc.save();

      deliveredCount += 1;
      await Broadcast.updateOne(
        { _id: broadcast._id },
        { $inc: { deliveredCount: 1 } },
      );
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Unknown SMTP transmission error";
      console.error(`[broadcast:dispatch] Send failed to ${member.email}:`, err);

      logDoc.status = "failed";
      logDoc.attempts = 1;
      logDoc.error = errMsg.slice(0, 4000);
      await logDoc.save();

      failedCount += 1;
      await Broadcast.updateOne(
        { _id: broadcast._id },
        { $inc: { failedCount: 1 } },
      );
    }

    // Brief delay to prevent SMTP server rate limit congestion
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  // 4. Finalize broadcast record
  const finalState =
    failedCount === activeMembers.length && activeMembers.length > 0
      ? "failed"
      : "sent";

  broadcast.state = finalState;
  broadcast.sentAt = new Date();
  broadcast.deliveredCount = deliveredCount;
  broadcast.failedCount = failedCount;
  await broadcast.save();

  return {
    ok: true,
    delivered: deliveredCount,
    failed: failedCount,
  };
}
