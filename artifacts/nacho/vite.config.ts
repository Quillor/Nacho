import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Dev-only: serve the ~19MB placeholder video used by the Library dev-seed at a
// stable URL. `apply: "serve"` means this never participates in production
// builds, so the asset is never copied into the prod bundle.
const DEV_PLACEHOLDER_VIDEO_PATH = "/__dev-placeholder-video.webm";

function devPlaceholderVideo(): PluginOption {
  const assetPath = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "attached_assets",
    "placeholder_1780720147726.webm",
  );
  return {
    name: "nacho-dev-placeholder-video",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(DEV_PLACEHOLDER_VIDEO_PATH, (_req, res) => {
        if (!fs.existsSync(assetPath)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.writeHead(200, { "Content-Type": "video/webm" });
        fs.createReadStream(assetPath)
          .on("error", () => {
            res.statusCode = 500;
            res.end();
          })
          .pipe(res);
      });
    },
  };
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    devPlaceholderVideo(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
