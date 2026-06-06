import { Check, X } from "lucide-react";
import { Section, Note } from "@/components/docs/shared";
import { CopyBlock, CopyRow, RuleList } from "./ui";
import {
  BASE_PROMPT,
  POSE_ADDITIONS,
  NEGATIVE_PROMPT,
  AI_CONSISTENCY,
  USAGE_GOOD,
  USAGE_AVOID,
  PLACEMENT_RULES,
  SIZE_RECOMMENDED,
  CROP_RULES,
  DO_RULES,
  DONT_RULES,
} from "./prompts-data";

export function UsageGuidelines() {
  return (
    <Section title="Usage Guidelines">
      <Note>
        Reach for Nacho when the interface or message benefits from warmth,
        playfulness, personality, or explanation. Skip it where it would get in
        the way.
      </Note>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Good use cases</h4>
          <RuleList tone="do" items={USAGE_GOOD} />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Avoid using Nacho</h4>
          <RuleList tone="dont" items={USAGE_AVOID} />
        </div>
      </div>
      <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
        <h4 className="mb-3 text-lg font-bold">Placement</h4>
        <RuleList items={PLACEMENT_RULES} />
      </div>
    </Section>
  );
}

export function SizeCropping() {
  return (
    <Section title="Size & Cropping">
      <Note>
        Nacho is detailed and texture-rich, so scale with care. If the eyes,
        mouth, gloves, and shoes can&rsquo;t read clearly, use a simpler icon or
        skip the mascot entirely.
      </Note>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Recommended sizes</h4>
          <RuleList tone="do" items={SIZE_RECOMMENDED} />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Cropping rules</h4>
          <RuleList tone="dont" items={CROP_RULES} />
        </div>
      </div>
    </Section>
  );
}

export function AIPrompts() {
  return (
    <Section title="AI Generation Prompts">
      <Note>
        Generate new Nacho scenes with these prompts. Start from the base prompt,
        layer on a pose-specific addition, and always pass the negative prompt.
      </Note>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground/50">
          Base prompt
        </h3>
        <CopyBlock text={BASE_PROMPT} label="base prompt" />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground/50">
          Pose-specific additions
        </h3>
        <div className="space-y-3">
          {POSE_ADDITIONS.map((p) => (
            <CopyRow key={p.label} label={p.label} text={p.text} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground/50">
          Negative prompt
        </h3>
        <CopyBlock text={NEGATIVE_PROMPT} label="negative prompt" />
      </div>

      <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
        <h4 className="mb-3 text-lg font-bold">Consistency requirements</h4>
        <RuleList items={AI_CONSISTENCY} />
      </div>
    </Section>
  );
}

export function DoDontSection() {
  return (
    <Section title="Do / Don't">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-foreground bg-accent px-3 py-1 text-xs font-black uppercase tracking-widest text-accent-foreground">
            <Check className="h-4 w-4" /> Do
          </div>
          <RuleList tone="do" items={DO_RULES} />
        </div>
        <div className="rounded-sm border-2 border-destructive bg-background p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-destructive bg-destructive px-3 py-1 text-xs font-black uppercase tracking-widest text-destructive-foreground">
            <X className="h-4 w-4" /> Don&rsquo;t
          </div>
          <RuleList tone="dont" items={DONT_RULES} />
        </div>
      </div>
    </Section>
  );
}
