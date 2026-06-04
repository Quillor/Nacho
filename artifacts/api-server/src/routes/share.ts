import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, publishedRecordingsTable } from "@workspace/db";

const router: IRouter = Router();

// Base path of the Nacho web app SPA (where the rich public view lives).
const NACHO_BASE = process.env.NACHO_BASE_PATH || "/nacho/";

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
 * GET /s/:shareId
 *
 * Server-rendered share page that emits Open Graph meta tags so links unfurl
 * in chat apps, then redirects humans to the rich SPA public view. Crawlers do
 * not run JS, so they read the OG tags; browsers follow the redirect.
 */
router.get("/s/:shareId", async (req, res): Promise<void> => {
  const raw = req.params.shareId;
  const shareId = Array.isArray(raw) ? raw[0] : raw;

  const [row] = await db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.shareId, shareId));

  if (!row) {
    res.status(404).send("Recording not found");
    return;
  }

  const origin = `${req.protocol}://${req.get("host")}`;
  const appUrl = `${origin}${NACHO_BASE}v/${shareId}`;
  const image = row.thumbnailPath
    ? `${origin}/api/storage${row.thumbnailPath}`
    : "";
  const videoUrl = `${origin}/api/storage${row.videoPath}`;

  const title = esc(row.title || "Nacho recording");
  const descSource = stripHtml(row.description || "");
  const description = esc(
    descSource.length > 0
      ? descSource.slice(0, 200)
      : "Watch this recording on Nacho.",
  );

  const html = `<!doctype html>
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

  res.set("Content-Type", "text/html; charset=utf-8").send(html);
});

export default router;
