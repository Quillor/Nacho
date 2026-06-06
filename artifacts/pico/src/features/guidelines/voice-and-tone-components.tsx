import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

/** Side-by-side approved ("Do") vs. rejected ("Don't") copy pair used
 *  throughout the voice-and-tone scenarios. */
export function DoDont({ do: doText, dont }: { do: string; dont: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="border-2 border-foreground bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center border border-foreground bg-accent text-accent-foreground">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="font-display text-sm font-extrabold uppercase tracking-widest">
            Do
          </span>
        </div>
        <p className="text-lg font-bold leading-snug text-foreground">
          “{doText}”
        </p>
      </div>
      <div className="border-2 border-dashed border-foreground/50 bg-background p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center border border-foreground bg-destructive text-destructive-foreground">
            <X className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="font-display text-sm font-extrabold uppercase tracking-widest text-foreground/60">
            Don't
          </span>
        </div>
        <p className="text-lg font-medium leading-snug text-foreground/60 line-through decoration-destructive/60 decoration-2">
          “{dont}”
        </p>
      </div>
    </div>
  );
}

/** A single titled writing scenario: an icon + index header, a recommended
 *  pattern callout, and a stack of {@link DoDont} examples as children. */
export function Scenario({
  index,
  title,
  icon,
  pattern,
  children,
}: {
  index: string;
  title: string;
  icon: ReactNode;
  pattern: string;
  children: ReactNode;
}) {
  return (
    <section className="border-2 border-foreground bg-background shadow-md">
      <header className="flex flex-col gap-4 border-b-2 border-foreground bg-accent p-6 md:flex-row md:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-foreground bg-background shadow-sm">
          {icon}
        </div>
        <div>
          <div className="font-mono text-sm font-bold uppercase tracking-widest text-accent-foreground/70">
            {index}
          </div>
          <h3 className="font-display text-2xl font-extrabold leading-none text-accent-foreground md:text-3xl">
            {title}
          </h3>
        </div>
      </header>
      <div className="space-y-5 p-6">
        <div className="border-l-2 border-foreground bg-card px-4 py-3">
          <span className="font-display text-xs font-extrabold uppercase tracking-widest text-foreground/60">
            Pattern
          </span>
          <p className="text-base font-medium leading-relaxed text-foreground/90">
            {pattern}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
