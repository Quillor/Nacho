import React from "react";
import { Badge } from "@workspace/pico-ui/badge";
import { Button } from "@workspace/pico-ui/button";
import { RAMPS, semanticGroups } from "./colors-data";
import { Ramp, COMBO_RENDERERS, PrimaryAccentCombo } from "./colors-combos";

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

        <div className="grid md:grid-cols-[1fr_2fr] border-2 border-foreground rounded-sm overflow-hidden shadow-md">
          <div className="bg-background text-foreground p-8 border-b-2 md:border-b-0 md:border-r-2 border-foreground flex flex-col justify-center">
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
                <Button size="lg" disabled className="bg-background text-primary border border-foreground opacity-50 cursor-not-allowed font-bold">
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
