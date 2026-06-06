import React from "react";
import { Badge } from "@workspace/pico-ui/badge";
import { Button } from "@workspace/pico-ui/button";
import tokens from "@workspace/pico-theme/tokens.json";

type ColorToken = { hsl: string; css: string; hex: string };
type PrimitiveShade = ColorToken & { step: number };
type SemanticToken = {
  role: string;
  token: string;
  tailwind: string;
  figmaName: string;
  light: ColorToken;
  dark: ColorToken;
};
type SemanticGroup = {
  group: string;
  label: string;
  blurb: string;
  tokens: SemanticToken[];
};

const primitives = tokens.primitives as Record<string, PrimitiveShade[]>;
const semanticGroups = tokens.semanticGroups as SemanticGroup[];

/** Flat lookup of every semantic token by its Figma variable name. */
const tokenByFigma = new Map<string, SemanticToken>();
for (const g of semanticGroups) {
  for (const t of g.tokens) tokenByFigma.set(t.figmaName, t);
}

const RAMPS: { hue: string; label: string; blurb: string }[] = [
  { hue: "yellow", label: "Yellow", blurb: "Primary brand fill. Loud highlights, hero moments, CTAs." },
  { hue: "brown", label: "Brown", blurb: "The unified ramp. Light shades for canvas, mid shades for secondary surfaces, deep shades for ink." },
  { hue: "red", label: "Red", blurb: "Danger and destructive actions. Used sparingly." },
];

const ROLE_PREFIX: Record<string, string> = {
  background: "bg",
  element: "text",
  foreground: "text",
  "accent-foreground": "text",
  border: "border",
  ring: "ring",
};

function tailwindClass(t: SemanticToken) {
  return `${ROLE_PREFIX[t.role] ?? "bg"}-${t.tailwind}`;
}

function needsLightText(step: number) {
  return step >= 500;
}

function Ramp({ hue, label, blurb }: { hue: string; label: string; blurb: string }) {
  const shades = primitives[hue] ?? [];
  return (
    <div className="border-4 border-foreground rounded-sm overflow-hidden shadow-md">
      <div className="flex items-baseline justify-between gap-4 p-5 bg-background border-b-4 border-foreground">
        <h3 className="text-2xl font-display font-extrabold">{label}</h3>
        <p className="text-foreground/70 font-medium text-sm max-w-md text-right hidden sm:block">{blurb}</p>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10">
        {shades.map((shade) => (
          <div
            key={shade.step}
            className="aspect-square flex flex-col justify-between p-2"
            style={{ backgroundColor: shade.hex }}
          >
            <span className={`font-mono text-xs font-bold ${needsLightText(shade.step) ? "text-brown-50" : "text-brown-900"}`}>
              {shade.step}
            </span>
            <span className={`font-mono text-[10px] leading-tight ${needsLightText(shade.step) ? "text-brown-50/80" : "text-brown-900/70"}`}>
              {shade.hex}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Swatch({ color }: { color: ColorToken }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-block h-7 w-7 rounded-sm border-2 border-foreground shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <span className="font-mono text-xs">{color.hex}</span>
    </div>
  );
}

function TokenTable({ group }: { group: SemanticGroup }) {
  return (
    <div className="overflow-x-auto border-t-4 border-foreground">
      <table className="w-full border-collapse text-left min-w-[560px]">
        <thead>
          <tr className="bg-background text-foreground border-b-2 border-foreground/20 font-display">
            <th className="px-5 py-3 text-xs uppercase tracking-wide">Figma variable</th>
            <th className="px-5 py-3 text-xs uppercase tracking-wide">Tailwind</th>
            <th className="px-5 py-3 text-xs uppercase tracking-wide">Light</th>
            <th className="px-5 py-3 text-xs uppercase tracking-wide">Dark</th>
          </tr>
        </thead>
        <tbody>
          {group.tokens.map((t, i) => (
            <tr
              key={t.figmaName}
              className={`border-t border-foreground/15 ${i % 2 === 1 ? "bg-foreground/[0.03]" : ""}`}
            >
              <td className="px-5 py-3 font-mono text-sm font-bold align-middle whitespace-nowrap">
                {t.figmaName}
              </td>
              <td className="px-5 py-3 font-mono text-xs text-foreground/60 align-middle whitespace-nowrap">
                {tailwindClass(t)}
              </td>
              <td className="px-5 py-3 align-middle">
                <Swatch color={t.light} />
              </td>
              <td className="px-5 py-3 align-middle">
                <Swatch color={t.dark} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupShell({ group, children }: { group: SemanticGroup; children: React.ReactNode }) {
  return (
    <div className="border-4 border-foreground rounded-sm overflow-hidden shadow-md">
      {children}
      <TokenTable group={group} />
    </div>
  );
}

function PrimaryCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Primary</h3>
          <p className="opacity-80 mb-4">Brown on warm background. The standard reading experience — warm, legible, and grounded.</p>
          <Badge variant="outline" className="w-fit border-background text-background">Accessible AAA</Badge>
        </div>
        <div className="bg-background text-foreground p-8 md:p-12 flex flex-col justify-center">
          <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">Daily bread</h4>
          <p className="text-lg font-medium mb-8 max-w-md">This is where actual reading happens. Softer than pure white on black, and friendlier on the eyes.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
              Solid Action
            </Button>
            <Button size="lg" variant="outline" className="border-foreground text-foreground bg-transparent hover:bg-accent hover:text-accent-foreground shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
              Outline Action
            </Button>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

function AccentCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Accent</h3>
          <p className="opacity-80 mb-4">Yellow on Brown. Extremely high contrast, impossible to ignore. Banners, CTAs, emphasis.</p>
          <Badge variant="outline" className="w-fit border-background text-background">Accessible AAA</Badge>
        </div>
        <div className="bg-accent text-accent-foreground p-8 md:p-12 flex flex-col justify-center">
          <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">Loud & clear</h4>
          <p className="text-lg font-medium mb-8 max-w-md">Our bread and butter. Perfectly captures the snack-brand energy — you cannot miss it.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 border-2 border-transparent shadow-[4px_4px_0px_0px_hsl(var(--background)/0.3)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--background)/0.3)] transition-all font-bold">
              Solid Action
            </Button>
            <Button size="lg" variant="outline" className="border-accent-foreground text-accent-foreground hover:bg-foreground hover:text-primary shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
              Outline Action
            </Button>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

function InverseCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-accent text-accent-foreground p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Inverse</h3>
          <p className="opacity-80 mb-4">Light on deep brown. Flips the canvas for footers, hero breaks, and dramatic moments.</p>
          <Badge variant="outline" className="w-fit border-accent-foreground text-accent-foreground">Accessible AAA</Badge>
        </div>
        <div className="bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-center">
          <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">The midnight snack</h4>
          <p className="text-lg font-medium mb-8 max-w-md text-primary-foreground/90">Use for footers, dramatic section breaks, or when you need the reader to stop and pay attention.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-transparent shadow-[4px_4px_0px_0px_hsl(var(--background)/0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--background)/0.2)] transition-all font-bold">
              Solid Action
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-[4px_4px_0px_0px_hsl(var(--primary-foreground)/0.3)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--primary-foreground)/0.3)] transition-all font-bold">
              Outline Action
            </Button>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

function SecondaryCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Secondary</h3>
          <p className="opacity-80 mb-4">Brown on warm tan. A calmer surface for notes, metadata, and supporting panels.</p>
          <Badge variant="outline" className="w-fit border-background text-background">Supporting</Badge>
        </div>
        <div className="bg-secondary text-secondary-foreground p-8 md:p-12 flex flex-col justify-center">
          <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">Quiet aside</h4>
          <p className="text-lg font-medium mb-8 max-w-md">Steps back from the loud yellow so it can carry secondary content without competing for attention.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
              Solid Action
            </Button>
            <Button size="lg" variant="outline" className="border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-secondary shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
              Outline Action
            </Button>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

function MutedCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Muted</h3>
          <p className="opacity-80 mb-4">Low-emphasis brown text on a muted mid-tone surface. Captions, placeholders, and disabled states.</p>
          <Badge variant="outline" className="w-fit border-background text-background">Low emphasis</Badge>
        </div>
        <div className="bg-muted text-muted-foreground p-8 md:p-12 flex flex-col justify-center">
          <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">Background noise</h4>
          <p className="text-lg font-medium mb-8 max-w-md">Recedes deliberately. Timestamps, helper text, disabled controls — things that should be readable but not demand attention.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" disabled className="bg-foreground text-background border-2 border-transparent shadow-sm font-bold opacity-50 cursor-not-allowed">
              Disabled
            </Button>
            <span className="self-center font-mono text-sm font-bold">placeholder text</span>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

function DangerCombo({ group }: { group: SemanticGroup }) {
  return (
    <GroupShell group={group}>
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">Danger</h3>
          <p className="opacity-80 mb-4">Muted red for destructive, irreversible actions. Red fill, maroon borders, and offset shadow on a calm surface.</p>
          <Badge variant="outline" className="w-fit border-background text-background">Destructive</Badge>
        </div>
        <div className="bg-secondary p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md bg-background border-4 border-foreground rounded-sm p-6 md:p-8 shadow-[10px_10px_0px_0px_hsl(var(--destructive-border))]">
            <h4 className="text-2xl md:text-3xl mb-3 font-display font-extrabold text-destructive">
              Are you absolutely sure?
            </h4>
            <p className="text-base md:text-lg font-medium mb-8 text-foreground/80">
              This action cannot be undone. This will permanently delete your data.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="font-bold rounded-sm px-5 py-2.5 bg-background border-2 border-foreground text-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                className="font-bold rounded-sm px-5 py-2.5 bg-destructive text-destructive-foreground border-2 border-destructive-border shadow-[4px_4px_0px_0px_hsl(var(--destructive-border))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </GroupShell>
  );
}

/** Cross-group combo: accent elements placed on the primary (cream) canvas.
 *  Not tied to a single semantic group so rendered outside the main loop. */
function PrimaryAccentCombo() {
  const widgetTokens = [
    "primary/primary-background",
    "accent/accent-background",
    "accent/accent-element",
    "primary/accent-foreground",
  ]
    .map((name) => tokenByFigma.get(name))
    .filter((t): t is SemanticToken => Boolean(t));

  const tableGroup: SemanticGroup = {
    group: "primary",
    label: "Primary + Accent",
    blurb: "",
    tokens: widgetTokens,
  };

  return (
    <div className="border-4 border-foreground rounded-sm overflow-hidden shadow-md">
      <div className="grid md:grid-cols-[1fr_2fr]">
        <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center gap-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Primary + Accent</h3>
            <p className="opacity-80">
              Yellow on the primary canvas. Use accent as a{" "}
              <strong>fill</strong> at any size. For accent <strong>text</strong>{" "}
              on the canvas, use the darker{" "}
              <code className="font-mono text-xs bg-background/20 px-1 rounded-sm">text-accent-on-primary</code>{" "}
              token — raw <code className="font-mono text-xs bg-background/20 px-1 rounded-sm">text-accent</code>{" "}
              is too low-contrast on cream.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-accent text-accent-foreground border-0 font-bold">Fill: AAA</Badge>
            <Badge variant="outline" className="border-background text-background">Text: darker yellow</Badge>
          </div>
        </div>

        {/* Widget demo */}
        <div className="bg-background p-8 md:p-12 flex flex-col justify-center gap-8">
          {/* Pattern A — accent fill (safe at any size) */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-foreground/50 font-bold">
              Fill — always readable
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide">
                New
              </span>
              <span className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1.5 rounded-sm border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]">
                Featured
              </span>
              <span className="border-2 border-accent text-foreground text-sm font-bold px-3 py-1.5 rounded-sm">
                Outlined
              </span>
            </div>
            <p className="text-foreground/60 text-xs font-mono">
              bg-accent · text-accent-foreground · border-accent
            </p>
          </div>

          {/* Pattern B — darker accent text on the canvas */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-foreground/50 font-bold">
              Accent text — darker yellow
            </p>
            <div className="border-l-4 border-accent-on-primary pl-4">
              <h4 className="text-4xl font-display font-extrabold text-accent-on-primary leading-none mb-1">
                Big headline
              </h4>
              <p className="text-foreground font-medium text-base">
                Accent text uses{" "}
                <code className="font-mono text-xs bg-foreground/10 px-1">text-accent-on-primary</code>{" "}
                — a darker gold that stays legible on the light canvas. Body copy
                stays in{" "}
                <code className="font-mono text-xs bg-foreground/10 px-1">text-foreground</code>.
              </p>
            </div>
            <p className="text-foreground/60 text-xs font-mono">
              text-accent-on-primary (headings) · text-foreground (body)
            </p>
          </div>
        </div>
      </div>

      {/* Tokens used in this widget */}
      <TokenTable group={tableGroup} />
    </div>
  );
}

const COMBO_RENDERERS: Record<string, (g: SemanticGroup) => React.ReactNode> = {
  primary: (g) => <PrimaryCombo group={g} />,
  accent: (g) => <AccentCombo group={g} />,
  inverse: (g) => <InverseCombo group={g} />,
  secondary: (g) => <SecondaryCombo group={g} />,
  muted: (g) => <MutedCombo group={g} />,
  danger: (g) => <DangerCombo group={g} />,
};

export default function Colors() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Colors
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The Pico palette is tight, high-contrast, and unapologetic. Three
          primitive ramps anchor a small set of semantic tokens.
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-extrabold">Color Ramps</h2>
          <p className="text-foreground/70 font-medium max-w-2xl">
            Every Pico hue ships as an ordered ramp (50 → 900). Semantic tokens
            are anchored on these primitives, and they sync 1:1 to Figma color
            variables under <code className="font-mono bg-foreground/10 px-1">primitive/&lt;hue&gt;/&lt;step&gt;</code>.
          </p>
        </div>
        <div className="space-y-8">
          {RAMPS.map((r) => (
            <Ramp key={r.hue} {...r} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-extrabold">Color Groups</h2>
          <p className="text-foreground/70 font-medium max-w-2xl">
            Tokens are grouped into semantic families — a surface fill, the
            element laid on it, and any matching border. Each combination is
            shown alongside its Figma variables and Tailwind utilities. Use the
            tokens below, never raw hex.
          </p>
        </div>

        <div className="space-y-12">
          {semanticGroups.map((g) => {
            const renderer = COMBO_RENDERERS[g.group];
            return renderer ? (
              <React.Fragment key={g.group}>
                <div>{renderer(g)}</div>
                {g.group === "primary" && <PrimaryAccentCombo />}
              </React.Fragment>
            ) : null;
          })}
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-extrabold">Forbidden Combinations</h2>
        <p className="text-lg font-medium text-foreground/80 max-w-2xl">
          These pairings are strictly off-limits. They fail contrast checks and break the brand's promise of readability.
        </p>

        <div className="grid md:grid-cols-[1fr_2fr] border-4 border-foreground rounded-sm overflow-hidden shadow-md">
          <div className="bg-background text-foreground p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-2">Never Do</h3>
            <p className="opacity-80 mb-4">Yellow text on a cream or light background. Completely unreadable.</p>
            <Badge variant="outline" className="w-fit border-foreground text-foreground">Fails Contrast</Badge>
          </div>
          <div className="bg-background text-primary p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-background" />
            <div className="relative z-10">
              <h4 className="text-3xl md:text-4xl mb-4 font-display font-extrabold">The Faded Mural</h4>
              <p className="text-lg font-medium mb-8 max-w-md">
                Golden yellow on a cream wash is almost invisible. This is why we never allow <code className="font-mono bg-foreground/10 px-1">text-primary</code> on light surfaces.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" disabled className="bg-background text-primary border-2 border-foreground opacity-50 cursor-not-allowed font-bold">
                  Unreadable Action
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
