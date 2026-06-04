import React from "react";
import { Link } from "wouter";
import { Check, X, ArrowRight } from "lucide-react";

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
      <div className="inline-block px-3 py-1 bg-primary border-2 border-foreground shadow-sm rounded-sm font-bold tracking-widest uppercase text-xs">
        {eyebrow}
      </div>
      <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">
        {title}
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
      className={`p-8 border-4 border-foreground rounded-sm bg-background/50 ${className}`}
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
      <div className="border-4 border-foreground rounded-sm bg-background p-6 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 border-2 border-foreground bg-primary px-3 py-1 rounded-sm font-black uppercase text-xs tracking-widest">
          <Check className="h-4 w-4" /> Do
        </div>
        <p className="font-medium leading-relaxed text-foreground/80">
          {doText}
        </p>
      </div>
      <div className="border-4 border-destructive rounded-sm bg-background p-6 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 border-2 border-destructive bg-destructive px-3 py-1 rounded-sm font-black uppercase text-xs tracking-widest text-destructive-foreground">
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
      <span className="font-display font-black uppercase text-sm tracking-wider text-foreground/50">
        {label}
      </span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex items-center gap-1 border-2 border-foreground bg-card px-3 py-1 rounded-sm font-bold uppercase text-xs tracking-wide shadow-xs transition-transform hover:-translate-y-0.5"
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
      className="group flex flex-col border-4 border-foreground p-6 rounded-sm bg-background shadow-md transition-transform hover:-translate-y-1"
    >
      <h3 className="text-2xl font-display font-black uppercase mb-2">
        {title}
      </h3>
      <p className="font-medium text-foreground/80 flex-1">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 font-bold uppercase text-sm tracking-wide text-foreground/60 group-hover:text-foreground">
        Read pattern <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
