// Builds the server-rendered share page (Open Graph unfurl + redirect to the
// SPA viewer) for a public recording. Crawlers don't run JS, so they read the
// OG tags; browsers follow the injected redirect to the rich Nacho view.

import { eq } from "drizzle-orm";
import { db, publishedRecordingsTable } from "@workspace/db";

// Base path of the Nacho web app SPA (where the rich public view lives).
// The Nacho artifact is served at the root ("/"), so the public viewer route is
// "/v/:shareId". Keep a trailing slash so it composes cleanly with "v/:shareId".
const rawNachoBase = process.env.NACHO_BASE_PATH || "/";
const NACHO_BASE = rawNachoBase.endsWith("/")
  ? rawNachoBase
  : `${rawNachoBase}/`;

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build the OG share page HTML for a public recording. Returns null when the
 * recording doesn't exist or isn't public (private recordings must not unfurl).
 */
export async function buildSharePage(
  shareId: string,
  origin: string,
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.shareId, shareId));

  // Private recordings have no public link and must not unfurl.
  if (!row || row.visibility !== "public" || row.status !== "ready") return null;

  const appUrl = `${origin}${NACHO_BASE}v/${shareId}`;
  // Prefer the recording's own thumbnail; otherwise fall back to the Nacho
  // brand card so the link still unfurls with the brand mark.
  const brandImage = `${origin}${NACHO_BASE}opengraph.jpg`;
  const image = row.thumbnailPath
    ? `${origin}/api/storage${row.thumbnailPath}`
    : brandImage;
  const videoUrl = `${origin}/api/storage${row.videoPath}`;

  const title = esc(row.title || "Nacho recording");
  const descSource = stripHtml(row.description || "");
  const description = esc(
    descSource.length > 0
      ? descSource.slice(0, 200)
      : "Watch this recording on Nacho.",
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} · Nacho</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="video.other" />
<meta property="og:site_name" content="Nacho" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
${image ? `<meta property="og:image" content="${esc(image)}" />` : ""}
<meta property="og:url" content="${esc(appUrl)}" />
<meta property="og:video" content="${esc(videoUrl)}" />
<meta property="og:video:type" content="video/webm" />
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${esc(image)}" />` : ""}
<script>window.location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body>
<noscript><a href="${esc(appUrl)}">Watch "${title}" on Nacho</a></noscript>
</body>
</html>`;
}
