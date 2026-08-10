import { cn } from "@/lib/utils";
import type { CameraSize } from "../composite";

const OPTIONS: { id: CameraSize; label: string }[] = [
  { id: "none", label: "None" },
  { id: "small", label: "Small" },
  { id: "large", label: "Large" },
  { id: "full", label: "Full screen" },
];

/**
 * Live camera-size picker (none / small / large / full screen), usable while
 * recording — the composite applies the change on its next frame.
 */
export function CameraSizeControl({
  value,
  onChange,
}: {
  value: CameraSize;
  onChange: (size: CameraSize) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">Camera size</p>
      <div
        role="radiogroup"
        aria-label="Camera size"
        className="inline-flex overflow-hidden rounded-sm border-2 border-foreground"
      >
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-3 py-2 text-sm font-bold transition-colors",
              i > 0 && "border-l-2 border-foreground",
              value === opt.id
                ? "bg-accent text-accent-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === "full" && (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Full screen records only your camera — the screen share isn&apos;t
          visible until you switch back.
        </p>
      )}
    </div>
  );
}
