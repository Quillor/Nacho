import React from "react";
import { Link } from "wouter";
import { Check, X, ArrowRight, Link2 } from "lucide-react";

/** Turn a human title into a URL-safe anchor slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Scroll the element matching the current URL hash into view. */
function scrollToHash() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return;
  let hash = raw;
  try {
    hash = decodeURIComponent(raw);
  } catch {
    /* malformed hash — fall back to the raw value */
  }
  // Wait two frames so freshly-mounted (and animated-in) content exists.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }),
  );
}

/**
 * Mount inside the routed content so it runs once the new page is in the DOM.
 * Scrolls to the hash on navigation and whenever the hash changes.
 */
export function HashScroller() {
  React.useEffect(() => {
    scrollToHash();
    const onHash = () => scrollToHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return null;
}

export function PatternPage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-16">{children}</div>;
}

export function PageHeader({
  eyebrow = "PATTERN",
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-block px-3 py-1 bg-accent border border-foreground shadow-sm rounded-sm font-bold tracking-widest uppercase text-xs text-accent-foreground">
        {eyebrow}
      </div>
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
        {title}
      </h1>
      <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
        {intro}
      </p>
    </div>
  );
}

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  const anchor = id ?? slugify(title);
  const [copied, setCopied] = React.useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    window.history.replaceState(null, "", `#${anchor}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the hash is still updated for manual copy */
    }
  };

  return (
    <section className="space-y-8">
      <h2
        id={anchor}
        className="group flex scroll-mt-24 items-center gap-2 border-b-2 border-foreground pb-2 font-display text-3xl font-extrabold"
      >
        <span>{title}</span>
        <button
          type="button"
          onClick={copyLink}
          aria-label={`Copy link to ${title}`}
          title="Copy link to this section"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-foreground bg-background text-foreground opacity-0 shadow-xs transition-all hover:-translate-y-0.5 focus-visible:opacity-100 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>
      </h2>
      {children}
    </section>
  );
}

export function Preview({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-8 border-2 border-foreground rounded-sm bg-background/50 ${className}`}
    >
      {children}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
      {children}
    </p>
  );
}

export function DoDont({
  doText,
  dontText,
}: {
  doText: React.ReactNode;
  dontText: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 border border-foreground bg-accent px-3 py-1 rounded-sm font-black uppercase text-xs tracking-widest text-accent-foreground">
          <Check className="h-4 w-4" /> Do
        </div>
        <p className="font-medium leading-relaxed text-foreground/80">
          {doText}
        </p>
      </div>
      <div className="border-2 border-destructive rounded-sm bg-background p-6 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 border border-destructive bg-destructive px-3 py-1 rounded-sm font-black uppercase text-xs tracking-widest text-destructive-foreground">
          <X className="h-4 w-4" /> Don't
        </div>
        <p className="font-medium leading-relaxed text-foreground/80">
          {dontText}
        </p>
      </div>
    </div>
  );
}

export function BuiltWith({
  label = "Built with",
  items,
}: {
  label?: string;
  items: { title: string; href: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-display font-extrabold uppercase text-sm tracking-wider text-foreground/50">
        {label}
      </span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex items-center gap-1 border border-foreground bg-card px-3 py-1 rounded-sm font-bold uppercase text-xs tracking-wide shadow-xs transition-transform hover:-translate-y-0.5"
        >
          {item.title}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ))}
    </div>
  );
}

export function PatternIndexCard({
  title,
  href,
  desc,
}: {
  title: string;
  href: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border-2 border-foreground p-6 rounded-sm bg-background shadow-md transition-transform hover:-translate-y-1"
    >
 <h3 className="text-2xl font-display font-extrabold mb-2">
        {title}
      </h3>
      <p className="font-medium text-foreground/80 flex-1">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 font-bold uppercase text-sm tracking-wide text-foreground/60 group-hover:text-foreground">
        Read pattern <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
