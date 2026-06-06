import { Section, Note } from "@/components/docs/shared";
import { RuleList, ThumbGrid } from "./ui";
import { PALETTE, TEXTURES } from "./data";

export function ColorPalette() {
  return (
    <Section title="Color Palette">
      <Note>
        Nacho always uses the warm yellow chip palette. Keep blacks confident,
        whites warm and creamy, and shadows warm brown or stippled black &mdash;
        never cool gray or neon.
      </Note>
      <div className="overflow-hidden rounded-sm border-2 border-foreground shadow-md">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-foreground font-display text-sm uppercase text-background">
              <th className="p-4">Swatch</th>
              <th className="p-4">Name</th>
              <th className="p-4">Hex</th>
              <th className="hidden p-4 md:table-cell">Usage</th>
            </tr>
          </thead>
          <tbody className="font-medium text-foreground/80">
            {PALETTE.map((c, i) => (
              <tr
                key={c.hex}
                className={i % 2 === 0 ? "bg-background" : "bg-background/50"}
              >
                <td className="border-t border-foreground/10 p-4">
                  <span
                    className="block h-10 w-16 rounded-sm border-2 border-foreground"
                    style={{ backgroundColor: c.hex }}
                  />
                </td>
                <td className="border-t border-foreground/10 p-4 font-bold text-foreground">
                  {c.name}
                </td>
                <td className="border-t border-foreground/10 p-4">
                  <code className="rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-xs uppercase">
                    {c.hex}
                  </code>
                </td>
                <td className="hidden border-t border-foreground/10 p-4 md:table-cell">
                  {c.usage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Always</h4>
          <RuleList
            tone="do"
            items={[
              "Use the warm yellow chip palette",
              "Use black confidently for outlines, limbs, pupils, mouth",
              "Keep whites warm and slightly creamy",
              "Keep shadows warm brown or stippled black",
            ]}
          />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Never</h4>
          <RuleList
            tone="dont"
            items={[
              "Shift the chip body toward neon yellow",
              "Make the chip beige, brown, green, red, or orange overall",
              "Use pure cold white for gloves or shoes",
              "Use cool gray for shadows",
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

export function TextureSystem() {
  return (
    <Section title="Texture System">
      <Note>
        Surface texture is a key identity feature. Nacho should always carry
        tortilla speckles, grain, halftone shading, and print-inspired
        imperfections &mdash; visible but never distracting, and never so heavy
        the expression becomes hard to read.
      </Note>
      <ThumbGrid items={TEXTURES} cols="lg:grid-cols-3" stage="cream" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Keep</h4>
          <RuleList
            tone="do"
            items={[
              "Tortilla speckles baked into the chip",
              "A warm, printed, vintage feel",
              "Halftone shading subtle and controlled",
              "Grain on the black limbs so they aren't flat",
            ]}
          />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Avoid</h4>
          <RuleList
            tone="dont"
            items={[
              "Smooth or plastic chip surfaces",
              "Glossy gradients",
              "Realistic food-photography texture",
              "Over-texturing the face until it's unreadable",
            ]}
          />
        </div>
      </div>
    </Section>
  );
}
