import tokens from "@workspace/pico-theme/tokens.json";

/**
 * Branded email layout for all outgoing Nacho mail.
 *
 * Wraps a heading + body in a table-based, inline-styled HTML shell using the
 * Pico design system: cream page background, deep-brown text, golden-yellow
 * accent, a contained card, and the brand fonts (DM Sans body / Platypi
 * headings) with web-safe fallback stacks. A centered horizontal Nacho wordmark
 * renders at the top from an absolute, publicly reachable URL so it loads in
 * real email clients (which generally cannot render SVG or relative paths).
 *
 * Color/font values are pulled from the shared Pico tokens so the emails stay
 * aligned with the rest of the design system.
 */

const light = tokens.colors.light;

const PAGE_BG = light.muted.hex; // subtle cream so the card reads as contained
const CARD_BG = light.background.hex; // brighter cream card surface
const TEXT = light.foreground.hex; // deep brown
const MUTED_TEXT = light["muted-foreground"].hex; // softer brown
const ACCENT = light.primary.hex; // golden yellow (fill/accent only)
const BORDER = light.foreground.hex; // deep brown chunky border

// Brand fonts from the Pico tokens, extended with web-safe fallbacks for
// clients that don't load web fonts.
const BODY_FONT = `${tokens.fonts.sans}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const HEADING_FONT = `${tokens.fonts.display}, Georgia, "Times New Roman", serif`;

/**
 * Absolute, publicly reachable base URL for this deployment. Prefers the
 * published production domain(s), falling back to the dev domain. Derived from
 * the environment so links/assets resolve in both prod and dev rather than
 * being hardcoded.
 */
function publicBaseUrl(): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const first = domains.split(",")[0]?.trim();
    if (first) return `https://${first}`;
  }
  const dev = process.env.REPLIT_DEV_DOMAIN;
  if (dev) return `https://${dev}`;
  return "";
}

/**
 * Absolute URL to the horizontal Nacho wordmark PNG. The Nacho web app is
 * served at the root, so its public `logo.png` is reachable without auth.
 */
function logoUrl(): string {
  const base = publicBaseUrl();
  return base ? `${base}/logo.png` : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BrandedEmailOptions {
  /** Plain-text heading shown at the top of the card (escaped automatically). */
  heading: string;
  /** Trusted/pre-escaped HTML for the email body. */
  bodyHtml: string;
  /** Optional hidden preheader text shown in inbox previews. */
  previewText?: string;
}

/**
 * Render a complete branded HTML email document.
 *
 * `bodyHtml` is inserted verbatim — callers must pass already-escaped/safe HTML.
 */
export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const { heading, bodyHtml, previewText } = opts;
  const logo = logoUrl();
  const safeHeading = escapeHtml(heading);

  const preheader = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGE_BG};font-size:1px;line-height:1px;">${escapeHtml(
        previewText,
      )}</div>`
    : "";

  const logoBlock = logo
    ? `<img src="${escapeHtml(
        logo,
      )}" alt="Nacho" width="180" style="display:block;width:180px;max-width:60%;height:auto;border:0;margin:0 auto;" />`
    : `<div style="font-family:${HEADING_FONT};font-size:32px;font-weight:800;color:${TEXT};">Nacho</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Platypi:wght@700;800&display=swap');
  body { margin: 0; padding: 0; }
  a { color: ${TEXT}; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            ${logoBlock}
          </td>
        </tr>
        <tr>
          <td style="background-color:${CARD_BG};border:2px solid ${BORDER};border-radius:8px;box-shadow:6px 6px 0px 0px ${BORDER};padding:32px;">
            <h1 style="margin:0;font-family:${HEADING_FONT};font-size:24px;line-height:1.2;font-weight:800;color:${TEXT};">${safeHeading}</h1>
            <div style="width:48px;height:6px;background-color:${ACCENT};border-radius:3px;margin:16px 0 24px;"></div>
            <div style="font-family:${BODY_FONT};font-size:16px;line-height:1.5;color:${TEXT};">
              ${bodyHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 8px 0;font-family:${BODY_FONT};font-size:13px;line-height:1.5;color:${MUTED_TEXT};">
            Sent by Nacho · the browser-based screen recorder
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
