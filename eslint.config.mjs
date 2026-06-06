// Root ESLint flat config — repo-wide structural guardrails.
//
// Primary job today: enforce MODULE BOUNDARIES so the monorepo stays
// maintainable. Artifacts (apps) may NOT import each other; anything shared
// between apps must live in a `lib/*` package (see ARCHITECTURE.md). This rule
// is already satisfied across the codebase, so it runs at "error" now.
//
// Stylistic and type-aware rules are deliberately left OFF here so the lint
// step does not flag the existing (not-yet-migrated) code. Typecheck,
// `check-file-size`, and `check-contrast` cover the rest of the quality gates.
// `react-hooks` is registered (but its rules stay off) only so the existing
// `eslint-disable react-hooks/*` directives in app code resolve. Deeper
// per-feature layering rules are tightened once the feature folders exist
// (final reorganization step).

import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/*.tsbuildinfo",
      "**/.replit-artifact/**",
      "**/generated/**",
      "**/*.gen.ts",
      "**/*.d.ts",
      "**/public/**",
      "**/attached_assets/**",
      ".local/**",
      ".agents/**",
      "**/*.config.*",
      // Generated tooling artifact — a scaffolded preview harness, not product code.
      "artifacts/mockup-sandbox/**",
      // Build-time generated asset bundles.
      "lib/pico-figma-plugin/src/generated/**",
    ],
  },
  {
    files: ["artifacts/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "scripts/**/*.ts"],
    linterOptions: {
      // Existing app code carries `eslint-disable react-hooks/*` directives that
      // are "unused" while those rules are off; don't flag them as noise.
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { boundaries, "react-hooks": reactHooks },
    settings: {
      "boundaries/include": ["artifacts/**/*", "lib/**/*", "scripts/**/*"],
      "boundaries/elements": [
        { type: "lib", pattern: "lib/*", mode: "folder", capture: ["lib"] },
        { type: "app", pattern: "artifacts/*", mode: "folder", capture: ["app"] },
        { type: "scripts", pattern: "scripts/*", mode: "folder" },
      ],
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
    },
    rules: {
      // Apps are isolated: an app may import shared libs and its own files,
      // never another app. Libs may import other libs. Scripts may import libs.
      // External packages (react, @radix-ui, ...) are not elements and are
      // ignored by this rule.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Boundary violation: apps cannot import other apps, and libs cannot import apps. Extract shared code into a lib/* package (see ARCHITECTURE.md).",
          rules: [
            // An app may import shared libs.
            { from: { type: "app" }, allow: { to: { type: "lib" } } },
            // An app may import its own files (same captured app name only).
            { from: { type: "app" }, allow: { to: { type: "app", captured: { app: "{{ from.app }}" } } } },
            // Libs may import other libs.
            { from: { type: "lib" }, allow: { to: { type: "lib" } } },
            // Scripts may import libs and other scripts.
            { from: { type: "scripts" }, allow: { to: { type: ["lib", "scripts"] } } },
          ],
        },
      ],
    },
  },
];
