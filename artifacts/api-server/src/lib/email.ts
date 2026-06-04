import pkg from "@replit/connectors-sdk";
import { logger } from "./logger";

const { ReplitConnectors } = pkg;
const connectors = new ReplitConnectors();

// Resend requires a verified sender. Allow operators to override via env;
// fall back to Resend's shared onboarding sender for first-run setups.
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL ?? "Nacho <onboarding@resend.dev>";

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  try {
    const resp = await connectors.proxy("resend", "/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      logger.warn({ status: resp.status, text, to }, "Resend send failed");
      return { ok: false, error: `Resend responded ${resp.status}` };
    }
    return { ok: true };
  } catch (err) {
    logger.error({ err, to }, "Resend send threw");
    return { ok: false, error: "Email delivery failed" };
  }
}
