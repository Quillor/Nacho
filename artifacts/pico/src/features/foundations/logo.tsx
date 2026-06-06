import { Section, Preview, Note, DoDont } from "@/components/docs/shared";

const wordmark = `${import.meta.env.BASE_URL}logo-wordmark.svg`;
const mark = `${import.meta.env.BASE_URL}logo-mark.svg`;

export default function Logo() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Logo
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The Nacho mark is a chunky golden play button — a snack-brand take on
          "press record". Use it confidently, keep it clean, and never redraw it.
        </p>
      </div>

      <Section title="The variants">
        <Note>
          Two primary assets carry the brand. The horizontal wordmark pairs the
          mark with the "Nacho" type for headers and marketing. The standalone
          circular mark stands in wherever space is tight.
        </Note>

        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="border-2 border-foreground rounded-sm overflow-hidden shadow-md">
            <div className="bg-accent p-12 flex items-center justify-center border-b-2 border-foreground min-h-[220px]">
              <img
                src={wordmark}
                alt="Nacho horizontal wordmark"
                className="w-full max-w-md"
              />
            </div>
            <div className="p-6 bg-background">
 <h3 className="text-2xl font-bold mb-1">Wordmark</h3>
              <p className="text-foreground/70 font-medium">
                Mark + "Nacho" lockup. The default, primary logo. Use it in app
                headers, the marketing site, decks, and anywhere there's room to
                breathe.
              </p>
            </div>
          </div>

          <div className="border-2 border-foreground rounded-sm overflow-hidden shadow-md">
            <div className="bg-foreground p-12 flex items-center justify-center border-b-2 border-foreground min-h-[220px]">
              <img
                src={mark}
                alt="Nacho circular play-button mark"
                className="w-32 h-32"
              />
            </div>
            <div className="p-6 bg-background">
 <h3 className="text-2xl font-bold mb-1">Mark</h3>
              <p className="text-foreground/70 font-medium">
                The circular play button on its own. Use it for favicons,
                avatars, app icons, and any tight or square space where the
                wordmark won't fit.
              </p>
            </div>
          </div>
        </div>

        <Note>
          A <strong>square avatar variant</strong> shares the exact same circular
          mark, sized and centered inside a square frame (with the brand yellow
          bleeding to the edges). Reach for it for social profile pictures and
          app-store tiles where a square crop is required.
        </Note>
      </Section>

      <Section title="Construction">
        <Note>
          Every piece of the mark is a Pico token. Don't eyeball the colors —
          they come straight from the palette.
        </Note>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-accent border-2 border-foreground mb-4" />
 <h3 className="text-xl font-bold mb-1">Yellow circle</h3>
            <p className="text-foreground/70 font-medium text-sm">
              The container is a full circle in Golden Yellow{" "}
              <code className="font-mono bg-foreground/10 px-1">#F5C518</code>.
            </p>
          </div>
          <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm">
            <div className="h-16 w-16 rounded-sm bg-[#FFE896] border-2 border-[#4F2D16] mb-4 flex items-center justify-center">
              <span className="ml-1 inline-block border-y-[10px] border-l-[16px] border-y-transparent border-l-[#4F2D16]" />
            </div>
 <h3 className="text-xl font-bold mb-1">Play triangle</h3>
            <p className="text-foreground/70 font-medium text-sm">
              A right-pointing triangle with a thick Deep Brown{" "}
              <code className="font-mono bg-foreground/10 px-1">#4F2D16</code>{" "}
              outline.
            </p>
          </div>
          <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm">
            <div className="h-16 w-16 rounded-sm bg-[#FFE896] border-2 border-foreground mb-4" />
 <h3 className="text-xl font-bold mb-1">Light fill</h3>
            <p className="text-foreground/70 font-medium text-sm">
              The triangle is filled with a soft light brown{" "}
              <code className="font-mono bg-foreground/10 px-1">#FFE896</code>,
              with a subtle center seam for depth.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Clear space">
        <Note>
          Keep clear space around the logo equal to the radius of the circular
          mark on every side. Nothing — type, edges, other logos, or busy
          texture — should intrude into that zone.
        </Note>
        <Preview className="flex items-center justify-center">
          <div className="relative inline-flex items-center justify-center p-12 border border-dashed border-foreground/40 rounded-sm bg-background">
            <img src={mark} alt="Nacho mark with clear space" className="w-28 h-28" />
            <span className="absolute top-2 left-2 font-mono text-xs font-bold uppercase text-foreground/50">
              ½ × mark
            </span>
          </div>
        </Preview>
      </Section>

      <Section title="Minimum size">
        <Note>
          Don't let the logo get so small it turns to mush. Below these sizes,
          switch to the mark or drop the logo entirely.
        </Note>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm flex items-center gap-6">
            <img src={wordmark} alt="Wordmark at minimum size" className="w-32" />
            <div>
 <h3 className="text-lg font-bold">Wordmark</h3>
              <p className="text-foreground/70 font-medium text-sm">
                Minimum <strong>120px</strong> wide on screen.
              </p>
            </div>
          </div>
          <div className="border-2 border-foreground rounded-sm bg-background p-6 shadow-sm flex items-center gap-6">
            <img src={mark} alt="Mark at minimum size" className="w-8 h-8" />
            <div>
 <h3 className="text-lg font-bold">Mark</h3>
              <p className="text-foreground/70 font-medium text-sm">
                Minimum <strong>24px</strong> square (e.g. favicon).
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Which variant, where">
        <div className="border-2 border-foreground rounded-sm overflow-hidden shadow-md">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground text-background font-display uppercase text-sm">
                <th className="p-4">Context</th>
                <th className="p-4">Use</th>
              </tr>
            </thead>
            <tbody className="font-medium text-foreground/80">
              {[
                ["App header / top nav", "Wordmark"],
                ["Marketing & landing pages", "Wordmark"],
                ["Slides & document headers", "Wordmark"],
                ["Favicon & browser tab", "Mark"],
                ["Avatar / profile picture", "Square mark"],
                ["App icon / store tile", "Square mark"],
                ["Tight or square spaces", "Mark"],
              ].map(([ctx, use], i) => (
                <tr
                  key={ctx}
                  className={i % 2 === 0 ? "bg-background" : "bg-background/50"}
                >
                  <td className="p-4 border-t border-foreground/10">{ctx}</td>
 <td className="p-4 border-t border-foreground/10 font-bold text-foreground">
                    {use}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Logo placement">
        <Note>
          The logo is the one thing in Pico you should never get playful with.
          Place it on clean, high-contrast backgrounds and leave it exactly as
          drawn.
        </Note>
        <div className="space-y-6">
          <DoDont
            doText="Place the logo on the brand yellow, light, or deep brown — backgrounds where the mark stays high-contrast and legible."
            dontText="Drop it on a busy photo, gradient, or low-contrast color where the play button disappears."
          />
          <DoDont
            doText="Keep the official colors: yellow circle, brown-outlined triangle, light fill. Use the supplied SVG."
            dontText="Recolor, tint, or restyle the logo to match a section — the colors are fixed."
          />
          <DoDont
            doText="Scale the logo proportionally so it keeps its original aspect ratio."
            dontText="Stretch, squash, rotate, or skew the logo to fill a space."
          />
          <DoDont
            doText="Let the flat logo stand on its own with its built-in clear space."
            dontText="Add drop shadows, glows, outlines, or other effects on top of the mark."
          />
        </div>
      </Section>
    </div>
  );
}
