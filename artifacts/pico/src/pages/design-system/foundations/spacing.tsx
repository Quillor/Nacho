import { motion } from "framer-motion";
import tokens from "@workspace/pico-theme/tokens.json";

/** Short usage notes for notable steps on the scale (others fall back to "—"). */
const SPACE_NOTES: Record<string, string> = {
  "1": "Inner component tweaks",
  "2": "Tight component gaps",
  "3": "Compact stacks",
  "4": "Standard item gap",
  "6": "Comfortable item gap",
  "8": "Inner card padding",
  "12": "Section sub-breaks",
  "16": "Block spacing",
  "24": "Major section breaks",
  "32": "Hero / page rhythm",
};

export default function Spacing() {
  // Drive the scale straight from the shared token manifest so the docs always
  // match theme.css → tokens.json (and the Figma spacing variables).
  const spaces = Object.entries(
    tokens.spacing as Record<string, { rem: string; px: number }>,
  )
    .map(([token, value]) => ({ token, ...value }))
    .filter((s) => s.px > 0)
    .sort((a, b) => a.px - b.px);

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Spacing
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          We use a strict 4px baseline grid built on multiples of 8px.
          Everything should snap to it. Bigger jumps in spacing equal bigger
          structural importance.
        </p>
      </div>

      <div className="space-y-6">
        {spaces.map((space, i) => (
          <div key={space.token} className="flex items-center gap-6 group">
            <div className="w-32 shrink-0">
              <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit mb-1">
                space-{space.token}
              </div>
              <div className="text-xs font-bold text-foreground/60">
                {space.px}px / {space.rem}
              </div>
            </div>
            <div className="flex-1 max-w-md h-12 bg-accent/10 border-2 border-foreground/20 rounded-sm flex items-center px-1 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${space.px}px` }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="h-10 bg-accent border-2 border-foreground shrink-0"
              />
            </div>
            <div className="text-sm font-medium hidden md:block text-foreground/80">
              {SPACE_NOTES[space.token] ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
