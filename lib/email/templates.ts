/**
 * Email templates for transactional messages.
 *
 * Follows design system branding: Plus Jakarta Sans / system fonts,
 * dark ink text (#0E1533), brand blue accent (#3D5AF1), neutral tint cards (#F5F7FE),
 * and clean layout with plain-text counterparts.
 */

export type WelcomeEmailProps = {
  firstName: string;
  unsubToken: string;
  siteUrl?: string;
};

export type ContactNotifyProps = {
  name: string;
  email: string;
  business?: string;
  need?: string;
  message: string;
  ip?: string;
  receivedAt?: Date;
  siteUrl?: string;
};

export type TestimonialNotifyProps = {
  name: string;
  role?: string;
  business?: string;
  email: string;
  quote: string;
  siteUrl?: string;
};

export type TestEmailProps = {
  host: string;
  port: number;
  user: string;
  timestamp: string;
};

function emailWrapper(content: string, footerText?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GARSAME v3</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #F5F7FE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0E1533; -webkit-font-smoothing: antialiased;">
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
    <!-- Content -->
    <tr>
      <td style="padding: 32px; font-size: 15px; line-height: 1.7; color: #2B3453;">
        ${content}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #F8FAFF; border-top: 1px solid #EEF1FB; font-size: 12px; line-height: 1.6; color: #7D89AE;">
        ${footerText || "Garsame Mohamud · Software Engineer · Mogadishu, Somalia"}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWelcomeEmail({
  firstName,
  unsubToken,
  siteUrl = process.env.NEXTAUTH_URL || "https://garsame.so",
}: WelcomeEmailProps): { subject: string; html: string; text: string } {
  const unsubUrl = `${siteUrl.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  const subject = "Welcome to GARSAME updates";

  const htmlContent = `
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0E1533; letter-spacing: -0.02em;">Welcome, ${firstName}.</h1>
    <p style="margin: 0 0 16px;">Thanks for joining. You are now on the small list of people I share new work with first.</p>
    <p style="margin: 0 0 16px;">Here is what to expect:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #3C4870;">
      <li style="margin-bottom: 8px;"><strong>New systems before they are public</strong> — architecture and behind-the-scenes engineering decisions.</li>
      <li style="margin-bottom: 8px;"><strong>What I learned, written plainly</strong> — practical lessons from shipping production systems in East Africa.</li>
      <li style="margin-bottom: 8px;"><strong>A direct line to me</strong> — reply to any update email and it comes directly to my inbox.</li>
    </ul>
    <p style="margin: 0 0 24px;">No spam, no weekly automated quotas. Just honest engineering notes when something is finished.</p>
    <div style="border-top: 1px solid #E4E8F7; padding-top: 16px; font-size: 13px; color: #64708F;">
      Best regards,<br>
      <strong>Garsame Mohamud</strong><br>
      <span style="color: #97A2C0;">Mogadishu, Somalia</span>
    </div>
  `;

  const footerText = `You received this email because you signed up on garsame.so. If you'd like to leave, you can <a href="${unsubUrl}" style="color: #3D5AF1; text-decoration: underline;">unsubscribe with one click</a>.`;

  const text = `Welcome, ${firstName}.\n\nThanks for joining. You are now on the list of people I share new work with first.\n\nWhat to expect:\n- New systems before they are public\n- What I learned, written plainly\n- A direct line to me (just hit reply)\n\nBest regards,\nGarsame Mohamud\n\nUnsubscribe: ${unsubUrl}`;

  return {
    subject,
    html: emailWrapper(htmlContent, footerText),
    text,
  };
}

export function renderContactNotification({
  name,
  email,
  business,
  need,
  message,
  ip,
  receivedAt = new Date(),
  siteUrl = process.env.NEXTAUTH_URL || "https://garsame.so",
}: ContactNotifyProps): { subject: string; html: string; text: string } {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Mogadishu",
  }).format(receivedAt);

  const subject = `New enquiry from ${name}${business ? ` · ${business}` : ""}`;
  const inboxUrl = `${siteUrl.replace(/\/$/, "")}/admin/messages`;
  const mailtoReply = `mailto:${email}?subject=${encodeURIComponent(`Re: Your enquiry to Garsame`)}`;

  const htmlContent = `
    <div style="margin-bottom: 20px;">
      <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #3D5AF1; background-color: #EDF0FE; border-radius: 4px; padding: 3px 8px;">New Contact Message</span>
      <span style="font-size: 12px; color: #97A2C0; margin-left: 8px;">${formattedDate} EAT</span>
    </div>
    
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #F8FAFF; border: 1px solid #E4E8F7; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 4px 8px; font-weight: 600; color: #4A5573; width: 100px;">From:</td>
        <td style="padding: 4px 8px; color: #0E1533;"><strong>${name}</strong> &lt;${email}&gt;</td>
      </tr>
      ${business ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">Business:</td><td style="padding: 4px 8px; color: #0E1533;">${business}</td></tr>` : ""}
      ${need ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">Need:</td><td style="padding: 4px 8px; color: #3D5AF1; font-weight: 600;">${need}</td></tr>` : ""}
      ${ip ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">IP:</td><td style="padding: 4px 8px; font-family: monospace; font-size: 12px; color: #7D89AE;">${ip}</td></tr>` : ""}
    </table>

    <div style="margin-bottom: 24px; padding: 18px 20px; background-color: #FFFFFF; border: 1px solid #E4E8F7; border-radius: 8px; font-size: 15px; line-height: 1.7; color: #0E1533; white-space: pre-wrap;">${message}</div>

    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding-right: 12px;">
          <a href="${mailtoReply}" style="background-color: #3D5AF1; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reply via Email</a>
        </td>
        <td>
          <a href="${inboxUrl}" style="background-color: #FFFFFF; color: #4A5573; border: 1px solid #E4E8F7; font-size: 14px; font-weight: 600; padding: 9px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Admin</a>
        </td>
      </tr>
    </table>
  `;

  const text = `New enquiry from ${name}\n\nEmail: ${email}\nBusiness: ${business || "N/A"}\nNeed: ${need || "N/A"}\nReceived: ${formattedDate}\n\nMessage:\n${message}\n\nReply directly to: ${email}\nAdmin Inbox: ${inboxUrl}`;

  return {
    subject,
    html: emailWrapper(htmlContent),
    text,
  };
}

export function renderTestimonialNotification({
  name,
  role,
  business,
  email,
  quote,
  siteUrl = process.env.NEXTAUTH_URL || "https://garsame.so",
}: TestimonialNotifyProps): { subject: string; html: string; text: string } {
  const subject = `New testimonial submitted by ${name}${business ? ` · ${business}` : ""}`;
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/testimonials`;

  const htmlContent = `
    <div style="margin-bottom: 20px;">
      <span style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #B4690E; background-color: #FEF3E2; border-radius: 4px; padding: 3px 8px;">Pending Testimonial</span>
    </div>

    <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0E1533;">${name}</h2>
    <div style="font-size: 14px; color: #64708F; margin-bottom: 18px;">
      ${[role, business].filter(Boolean).join(" · ")} · <span style="color: #97A2C0;">(${email})</span>
    </div>

    <div style="margin-bottom: 24px; padding: 18px 20px; background-color: #F8FAFF; border-left: 3px solid #3D5AF1; border-radius: 0 8px 8px 0; font-size: 15px; line-height: 1.7; color: #0E1533; font-style: italic;">
      "${quote}"
    </div>

    <p style="margin: 0 0 20px; font-size: 13px; color: #64708F;">
      Remember: nothing appears publicly on the site until you review and publish it.
    </p>

    <a href="${adminUrl}" style="background-color: #3D5AF1; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Review in Testimonials Module</a>
  `;

  const text = `New testimonial from ${name}\n\nRole: ${role || "N/A"}\nBusiness: ${business || "N/A"}\nEmail (private): ${email}\n\nQuote:\n"${quote}"\n\nReview in Admin: ${adminUrl}`;

  return {
    subject,
    html: emailWrapper(htmlContent),
    text,
  };
}

export function renderTestEmail({
  host,
  port,
  user,
  timestamp,
}: TestEmailProps): { subject: string; html: string; text: string } {
  const subject = "GARSAME v3 — SMTP Test Message";

  const htmlContent = `
    <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0E1533;">SMTP Connection Successful</h1>
    <p style="margin: 0 0 16px;">This test message confirms that your SMTP mail settings on <strong>GARSAME v3</strong> are working properly.</p>
    
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #F8FAFF; border: 1px solid #E4E8F7; border-radius: 8px; padding: 16px;">
      <tr>
        <td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">Host:</td>
        <td style="padding: 4px 8px; font-family: monospace; color: #0E1533;">${host}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">Port:</td>
        <td style="padding: 4px 8px; font-family: monospace; color: #0E1533;">${port}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">User:</td>
        <td style="padding: 4px 8px; font-family: monospace; color: #0E1533;">${user}</td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; font-weight: 600; color: #4A5573;">Sent at:</td>
        <td style="padding: 4px 8px; color: #0E1533;">${timestamp}</td>
      </tr>
    </table>
  `;

  const text = `GARSAME v3 — SMTP Test Message\n\nSMTP Connection Successful!\nHost: ${host}\nPort: ${port}\nUser: ${user}\nSent at: ${timestamp}`;

  return {
    subject,
    html: emailWrapper(htmlContent),
    text,
  };
}
