import { Switch } from "@workspace/pico-ui/switch";
import { Label } from "@workspace/pico-ui/label";
import { FlaskConical } from "lucide-react";
import { isDevAuthBypassEnabled, setDevAuthBypass } from "@/lib/dev-auth";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Dev-only "Development mode" section for the admin sign-in page. Lets a
// developer flip the auth + super-admin bypass on/off without env vars or
// restarts. The whole section is gated behind import.meta.env.DEV so it (and
// this component) is dead-code eliminated from production builds.
export function DevModeToggle({ onEnabledPath }: { onEnabledPath: string }) {
  if (!import.meta.env.DEV) return null;

  const enabled = isDevAuthBypassEnabled();

  const handleToggle = (next: boolean) => {
    setDevAuthBypass(next);
    // Hard navigation so route gates, the banner, and the server cookie all
    // re-evaluate from the freshly persisted state.
    const target = next ? onEnabledPath : "/sign-in";
    window.location.href = `${basePath}${target}`;
  };

  return (
    <div className="w-[440px] max-w-full border-4 border-dashed border-foreground bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          <div>
            <Label
              htmlFor="dev-mode-bypass"
              className="text-sm font-bold uppercase tracking-wide text-foreground"
            >
              Development mode
            </Label>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Skip sign-in to test the console. Dev only.
            </p>
          </div>
        </div>
        <Switch
          id="dev-mode-bypass"
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label="Toggle development testing mode"
        />
      </div>
    </div>
  );
}
