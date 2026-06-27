import { useState } from "react";
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

function buildMasterPrompt(subject: string): string {
  const base = origin();
  const docUrl = `${base}${NACHO_DIR.replace("nacho/", "")}foundations/imagery`;
  const trimmed = subject.trim();
  const subjectBlock = trimmed
    ? `\n\n## SUBJECT TO GENERATE\n${trimmed}`
    : "";
  return `# NACHO MASCOT — MASTER GENERATION PROMPT

Full character documentation (read this for the complete spec):
${docUrl}

You are generating artwork of "Nacho", an existing brand mascot. Match the
canonical reference images linked below exactly — same style, proportions,
palette, line quality, and texture. Do not redesign the character.${subjectBlock}

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
  const [subject, setSubject] = useState("");
  return (
    <Section title="Master Prompt">
      <Note>
        One self-contained prompt for use in other AI tools. It links this
        documentation page and every high-resolution asset URL (live links that
        always point at the current domain), plus the full style, rules, and
        negative prompt. Copy it and paste it anywhere.
      </Note>
      <div className="space-y-2">
        <label
          htmlFor="nacho-subject"
          className="block font-display text-sm font-extrabold uppercase tracking-widest text-foreground/50"
        >
          Subject description (optional)
        </label>
        <input
          id="nacho-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Nacho riding a skateboard down a city street"
          className="w-full rounded-sm border-2 border-foreground bg-background px-4 py-2.5 font-medium text-foreground shadow-xs outline-none transition-shadow placeholder:text-foreground/40 focus-visible:shadow-[3px_3px_0px_0px_var(--primary)]"
        />
        <p className="text-sm font-medium text-foreground/60">
          Describe what Nacho should be doing. It's added to the prompt under
          &ldquo;Subject to generate&rdquo; and included when you copy.
        </p>
      </div>
      <CopyBlock text={buildMasterPrompt(subject)} label="master prompt" />
    </Section>
  );
}
