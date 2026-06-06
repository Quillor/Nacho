import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelfieCorner } from "../recorder";

const CORNERS: { id: SelfieCorner; pos: string }[] = [
  { id: "top-left", pos: "left-4 top-4" },
  { id: "top-right", pos: "right-4 top-4" },
  { id: "bottom-left", pos: "left-4 bottom-4" },
  { id: "bottom-right", pos: "right-4 bottom-4" },
];

// Overlay shown over the live preview (screen+camera mode, before recording)
// that lets the user pick which corner the selfie bubble sits in. Renders the
// four corner targets plus the helper caption.
export function SelfieCornerOverlay({
  corner,
  onChange,
}: {
  corner: SelfieCorner;
  onChange: (next: SelfieCorner) => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        {CORNERS.map((c) => {
          const selected = corner === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-label={`Selfie ${c.id.replace("-", " ")}`}
              aria-pressed={selected}
              onClick={() => onChange(c.id)}
              className={cn(
                "pointer-events-auto absolute flex items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground transition-all",
                c.pos,
                selected
                  ? "h-28 w-28 ring-4 ring-foreground shadow-md"
                  : "h-20 w-20 bg-primary/70 hover:bg-primary hover:scale-105",
              )}
            >
              {selected && <User className="h-14 w-14" />}
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
        <p className="border-2 border-foreground bg-background px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-foreground shadow-md">
          Tap a corner to place your selfie.
        </p>
      </div>
    </>
  );
}
