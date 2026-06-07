// Minimal loopback HTTP server for the packaged renderer.
//
// Why not file:// or a custom app:// scheme? Clerk (auth) requires an http(s)
// origin — it rejects custom schemes for redirect URLs ("Invalid URL scheme").
// Serving over http://localhost gives a real, valid origin so the full Clerk
// flow works, and a STABLE origin (fixed port) so the session and IndexedDB
// (recordings + notes) persist across launches.
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

// Fixed port so the origin is stable (IndexedDB/session persistence; OAuth
// redirect allow-listing). Falls back to an ephemeral port if it's taken.
const PREFERRED_PORT = 17653;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".map": "application/json; charset=utf-8",
};

export function startRendererServer(rendererDir: string): Promise<string> {
  const indexHtml = path.join(rendererDir, "index.html");

  const server = http.createServer((req, res) => {
    let filePath = indexHtml;
    try {
      const { pathname } = new URL(req.url || "/", "http://localhost");
      const rel = decodeURIComponent(pathname);
      const candidate = path.join(rendererDir, rel);
      const within =
        candidate === rendererDir ||
        candidate.startsWith(rendererDir + path.sep);
      const isFile =
        within &&
        path.extname(rel) !== "" &&
        existsSync(candidate) &&
        statSync(candidate).isFile();
      // Real asset → serve it; any app route → SPA fallback to index.html.
      if (isFile) filePath = candidate;
    } catch {
      filePath = indexHtml;
    }
    res.setHeader(
      "Content-Type",
      MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    );
    createReadStream(filePath)
      .on("error", () => {
        res.statusCode = 500;
        res.end("Internal error");
      })
      .pipe(res);
  });

  const listen = (port: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const onError = (err: NodeJS.ErrnoException) => {
        server.removeListener("error", onError);
        reject(err);
      };
      server.on("error", onError);
      // Bind to loopback only — never exposed beyond this machine.
      server.listen(port, "127.0.0.1", () => {
        server.removeListener("error", onError);
        const addr = server.address();
        const actual = typeof addr === "object" && addr ? addr.port : port;
        resolve(`http://localhost:${actual}`);
      });
    });

  return listen(PREFERRED_PORT).catch((err) => {
    if (err && err.code === "EADDRINUSE") return listen(0); // ephemeral fallback
    throw err;
  });
}
