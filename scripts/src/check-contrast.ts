import { readFileSync } from "fs";
import { globSync } from "glob";

/**
 * Pico Contrast Guardrail
 *
 * Scans all .tsx files for the forbidden pattern: `text-primary` (yellow text)
 * used on a light background. This is a low-contrast, unreadable combination
 * that must be caught at build time.
 *
 * Light surfaces (where text-primary is forbidden):
 *   bg-background, bg-card, bg-muted, bg-popover, bg-cream, bg-white
 * Dark surfaces (where text-primary is allowed):
 *   bg-foreground, bg-primary, bg-black, bg-dark, bg-brown, bg-[#2E1C0F]
 *
 * Usage: tsx ./src/check-contrast.ts
 * Exit code 0 = all clear, 1 = violations found.
 */

const LIGHT_BG_PATTERNS = [
  /bg-background\b/,
  /bg-card\b/,
  /bg-muted\b/,
  /bg-popover\b/,
  /bg-cream\b/,
  /bg-white\b/,
  /bg-\[#F6F3E9\]/,
  /bg-\[#F8F4E6\]/,
];

const DARK_BG_PATTERNS = [
  /bg-foreground\b/,
  /bg-primary\b/,
  /bg-black\b/,
  /bg-dark\b/,
  /bg-brown\b/,
  /bg-\[#2E1C0F\]/,
];

const TEXT_PRIMARY_PATTERN = /text-primary\b/;

function isOnLightBackground(line: string): boolean {
  // Check if line has a dark background — if so, text-primary is allowed
  const hasDarkBg = DARK_BG_PATTERNS.some((p) => p.test(line));
  if (hasDarkBg) return false;
  // Check if line has a light background — if so, text-primary is forbidden
  const hasLightBg = LIGHT_BG_PATTERNS.some((p) => p.test(line));
  return hasLightBg;
}

function main(): void {
  const files = globSync("./artifacts/**/*.tsx", { cwd: process.cwd() });
  const libFiles = globSync("./lib/**/*.tsx", { cwd: process.cwd() });
  const allFiles = [...files, ...libFiles];

  const violations: { file: string; line: number; text: string }[] = [];

  for (const file of allFiles) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (TEXT_PRIMARY_PATTERN.test(line) && isOnLightBackground(line)) {
        violations.push({ file, line: i + 1, text: line.trim() });
      }
    }
  }

  if (violations.length > 0) {
    console.error("\n[Pico Contrast Guardrail] Violations found: text-primary on a light background\n");
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`    ${v.text}`);
      console.error("");
    }
    console.error("Fix: change text-primary to text-foreground (or another high-contrast color) on light surfaces.\n");
    process.exit(1);
  }

  console.log("[Pico Contrast Guardrail] All clear — no low-contrast violations found.");
  process.exit(0);
}

main();
