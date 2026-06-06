import { Section, Note } from "@/components/docs/shared";
import { CopyBlock } from "./ui";
import { POSES, DETAILS, TEXTURES, NACHO_DIR } from "./data";
import {
  BASE_PROMPT,
  NEGATIVE_PROMPT,
  AI_CONSISTENCY,
} from "./prompts-data";

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function assetLines(items: { name: string; label: string }[]): string {
  const base = origin();
  return items
    .map((it) => `- ${it.name}: ${base}${NACHO_DIR}${it.label}`)
    .join("\n");
}

function buildMasterPrompt(): string {
  const base = origin();
  const docUrl = `${base}${NACHO_DIR.replace("nacho/", "")}foundations/imagery`;
  return `# NACHO MASCOT — MASTER GENERATION PROMPT

Full character documentation (read this for the complete spec):
${docUrl}

You are generating artwork of "Nacho", an existing brand mascot. Match the
canonical reference images linked below exactly — same style, proportions,
palette, line quality, and texture. Do not redesign the character.

## STYLE
${BASE_PROMPT}

## HARD RULES (must all be true)
${AI_CONSISTENCY.map((r) => `- ${r}`).join("\n")}

## NEGATIVE (never do this)
${NEGATIVE_PROMPT}

## REFERENCE IMAGE ASSETS (high-resolution; poses have transparent backgrounds)

### Character poses
${assetLines(POSES)}

### Detail close-ups
${assetLines(DETAILS)}

### Textures
${assetLines(TEXTURES)}

When a tool supports image references, attach the asset URLs above. Otherwise,
open the documentation URL to view the full character spec.`;
}

export function MasterPrompt() {
  return (
    <Section title="Master Prompt">
      <Note>
        One self-contained prompt for use in other AI tools. It links this
        documentation page and every high-resolution asset URL (live links that
        always point at the current domain), plus the full style, rules, and
        negative prompt. Copy it and paste it anywhere.
      </Note>
      <CopyBlock text={buildMasterPrompt()} label="master prompt" />
    </Section>
  );
}
