import { Mic } from "lucide-react";
import { Switch } from "@workspace/pico-ui/switch";

// A labelled icon + switch row used for the studio's capture toggles
// (mic, system audio, live captions). Presentational only.
export function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  icon: typeof Mic;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div>
          <span className="font-bold">{label}</span>
          {hint && (
            <p className="text-xs font-medium text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
