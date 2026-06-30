import { defineConfig } from "vitest/config";

// Standalone test config for the API server. The build pipeline uses esbuild
// (build.mjs), not Vite, so tests get this minimal node-environment config.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
