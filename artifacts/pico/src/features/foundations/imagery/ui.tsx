import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Thumb } from "./data";

/** A bordered card showing a Nacho asset on the brand-yellow stage. */
export function AssetThumb({
  src,
  label,
  name,
  blurb,
  stage = "accent",
}: {
  src: string;
  label: string;
  name?: string;
  blurb?: string;
  stage?: "accent" | "cream" | "dark";
}) {
  const stageClass =
    stage === "dark"
      ? "bg-foreground"
      : stage === "cream"
        ? "bg-[#FFF8DC]"
        : "bg-accent/15";
  return (
    <figure className="group flex flex-col overflow-hidden rounded-sm border-2 border-foreground bg-background shadow-sm">
      <div className={`flex aspect-square items-center justify-center overflow-hidden border-b-2 border-foreground p-6 ${stageClass}`}>
        <img
          src={src}
          alt={name ?? label}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <figcaption className="flex flex-1 flex-col gap-1.5 p-4">
        {name && <h4 className="text-lg font-bold leading-none">{name}</h4>}
        <code className="w-fit rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-xs">
          {label}
        </code>
        {blurb && (
          <p className="mt-1 text-sm font-medium leading-relaxed text-foreground/70">
            {blurb}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

/** Grid wrapper for asset thumbnails. */
export function ThumbGrid({
  items,
  cols = "lg:grid-cols-3",
  stage = "accent",
}: {
  items: Thumb[];
  cols?: string;
  stage?: "accent" | "cream" | "dark";
}) {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${cols}`}>
      {items.map((t) => (
        <AssetThumb
          key={t.n}
          src={t.src}
          label={t.label}
          name={t.name}
          blurb={t.blurb}
          stage={stage}
        />
      ))}
    </div>
  );
}

/** A bulleted rule list with optional positive/negative tone. */
export function RuleList({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "neutral" | "do" | "dont";
}) {
  const dot =
    tone === "do"
      ? "bg-accent text-accent-foreground"
      : tone === "dont"
        ? "bg-destructive text-destructive-foreground"
        : "bg-foreground text-background";
  const glyph = tone === "dont" ? "\u2715" : tone === "do" ? "\u2713" : "\u2022";
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 font-medium text-foreground/80">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-xs font-extrabold ${dot}`}>
            {glyph}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Pill-tag cloud, used for personality traits. */
export function TagCloud({
  items,
  tone = "do",
}: {
  items: string[];
  tone?: "do" | "dont";
}) {
  const cls =
    tone === "dont"
      ? "border-destructive/60 bg-destructive/10 text-foreground/80"
      : "border-foreground bg-accent text-accent-foreground";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-sm border px-3 py-1 text-sm font-bold ${cls}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}

/** A copyable code block with a confirming copy button. */
export function CopyBlock({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => copy(text)}
        aria-label={`Copy ${label}`}
        className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-sm border border-foreground bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-foreground shadow-xs transition-all hover:translate-y-[2px] hover:shadow-none"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border-2 border-foreground bg-foreground p-5 pt-14 font-mono text-sm leading-relaxed text-background shadow-[4px_4px_0px_0px_var(--primary)]">
        <code>{text}</code>
      </pre>
    </div>
  );
}

/** A compact copyable row, used for short pose-specific prompt additions. */
export function CopyRow({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-start gap-3 rounded-sm border-2 border-foreground bg-background p-4 shadow-sm">
      <span className="shrink-0 rounded-sm border border-foreground bg-accent px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent-foreground">
        {label}
      </span>
      <p className="flex-1 font-mono text-sm leading-relaxed text-foreground/80">
        {text}
      </p>
      <button
        type="button"
        onClick={() => copy(text)}
        aria-label={`Copy ${label} prompt addition`}
        className="shrink-0 rounded-sm border border-foreground bg-background p-1.5 text-foreground shadow-xs transition-all hover:-translate-y-0.5"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
