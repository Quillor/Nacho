// Single source of truth for the system emails Nacho sends. Each template is a
// pure function that takes its parameters and returns the subject + HTML body,
// so the real send sites and the admin preview page always render the same
// markup. Review-only: building a preview never sends anything.

export interface EmailContent {
  subject: string;
  html: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ViewNotificationParams {
  title: string;
  viewedAt: string;
}

/**
 * Sent to a recording's owner when someone watches their published recording
 * (only when they enabled notify-on-view). The title is HTML-escaped in the
 * body to guard against stored XSS.
 */
export function viewNotificationEmail({
  title,
  viewedAt,
}: ViewNotificationParams): EmailContent {
  const safeTitle = escapeHtml(title);
  return {
    subject: `Someone just watched "${title}"`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #2b2118;">
        <h2 style="margin: 0 0 12px;">Your recording was just watched</h2>
        <p style="margin: 0 0 8px;">
          <strong>${safeTitle}</strong> was viewed on ${escapeHtml(viewedAt)}.
        </p>
        <p style="margin: 16px 0 0; color: #6b5d4f;">— Nacho</p>
      </div>
    `,
  };
}

export interface BroadcastParams {
  subject: string;
  body: string;
}

/**
 * Sent from the admin Notifications page to all users or a specific group. The
 * subject and message are written by the operator; newlines in the message are
 * converted to <br/> to preserve the operator's line breaks.
 */
export function broadcastEmail({ subject, body }: BroadcastParams): EmailContent {
  return {
    subject,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">${body.replace(
      /\n/g,
      "<br/>",
    )}</div>`,
  };
}

export interface EmailPreview {
  id: string;
  name: string;
  description: string;
  subject: string;
  html: string;
  /** "our" — Nacho code (editable), "clerk" — Clerk-managed auth email */
  source: "our" | "clerk";
}

/**
 * Registry of every system email Nacho sends, rendered with representative
 * sample data for the admin preview page. Add new templates here and they show
 * up automatically.
 *
 * Clerk-managed auth emails (OTP, password reset) are included for review
 * because they are real system emails users receive, even though they are
 * configured in Clerk, not our code.
 */
export function emailPreviews(): EmailPreview[] {
  const sampleViewedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      id: "view-notification",
      name: "View notification",
      description:
        "Sent to a recording's owner when someone watches their published recording. Only fires when the owner enabled notify-on-view for that recording.",
      source: "our",
      ...viewNotificationEmail({
        title: "Quick product walkthrough",
        viewedAt: sampleViewedAt,
      }),
    },
    {
      id: "admin-broadcast",
      name: "Admin broadcast",
      description:
        "Sent from the Notifications page to all users or a specific group. The subject and message body are written by the operator at send time.",
      source: "our",
      ...broadcastEmail({
        subject: "Important update regarding your Nacho account",
        body: "Hi there,\n\nWe've shipped a few improvements to Nacho this week, including faster publishing and clearer share links.\n\nThanks for being part of Nacho!\n\u2014 The Nacho team",
      }),
    },
    // Clerk-managed auth emails
    {
      id: "clerk-otp-verification",
      name: "OTP verification",
      description:
        "Sent when a user signs up or signs in with email verification. The code expires after a few minutes. Managed by Clerk.",
      source: "clerk",
      subject: "684953 is your Nacho verification code",
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:480px;margin:0 auto;padding:24px;color:#2b2118;">
        <h2 style="margin:0 0 16px;">Verify it's you</h2>
        <p style="margin:0 0 16px;">Your Nacho verification code is:</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 24px;">684953</div>
        <p style="margin:0;color:#6b5d4f;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    },
    {
      id: "clerk-password-reset",
      name: "Password reset",
      description:
        "Sent when a user requests a password reset. The reset link expires after a short period. Managed by Clerk.",
      source: "clerk",
      subject: "Reset your Nacho password",
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:480px;margin:0 auto;padding:24px;color:#2b2118;">
        <h2 style="margin:0 0 16px;">Reset your password</h2>
        <p style="margin:0 0 16px;">We received a request to reset your Nacho password. Click the button below to continue.</p>
        <a href="#" style="display:inline-block;padding:12px 24px;background:#eab308;color:#2b2118;text-decoration:none;font-weight:700;border-radius:6px;">Reset password</a>
        <p style="margin:16px 0 0;color:#6b5d4f;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    },
  ];
}
