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
//
// `cameraLive` flips the selected target between two looks:
//  - false (setup, placeholder behind): a filled accent circle so the pick is
//    legible over the brown placeholder.
//  - true (ready, live composite behind): a transparent accent *ring* so the
//    actual selfie composited at that corner shows through instead of being
//    covered by an opaque circle.
export function SelfieCornerOverlay({
  corner,
  onChange,
  cameraLive = false,
}: {
  corner: SelfieCorner;
  onChange: (next: SelfieCorner) => void;
  cameraLive?: boolean;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        {CORNERS.map((c) => {
          const selected = corner === c.id;
          // When the camera is live, the selfie is already composited at the
          // selected corner. Don't draw any highlight over it — an overlay
          // circle never lines up perfectly with the canvas bubble. Only the
          // other corners stay as tappable targets to move the selfie.
          if (selected && cameraLive) return null;
          return (
            <button
              key={c.id}
              type="button"
              aria-label={`Selfie ${c.id.replace("-", " ")}`}
              aria-pressed={selected}
              onClick={() => onChange(c.id)}
              className={cn(
                "pointer-events-auto absolute flex items-center justify-center rounded-full border-2 border-foreground transition-all",
                c.pos,
                selected
                  ? "h-28 w-28 bg-accent text-accent-foreground ring-4 ring-foreground shadow-md"
                  : "h-20 w-20 bg-secondary text-secondary-foreground hover:scale-105 hover:bg-secondary/80",
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
