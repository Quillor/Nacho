import { Button } from "@workspace/pico-ui/button";
import { FlaskConical } from "lucide-react";
import { setDevAuthBypass } from "@workspace/shared";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Dev-only "Development mode" section for the sign-in page. Lets a developer
// skip the auth bypass with a single click instead of a toggle. The whole
// section is gated behind import.meta.env.DEV so it (and this component) is
// dead-code eliminated from production builds.
export function DevModeToggle({ onEnabledPath }: { onEnabledPath: string }) {
  if (!import.meta.env.DEV) return null;

  const handleLogin = () => {
    setDevAuthBypass(true);
    // Hard navigation so route gates, the banner, and the server cookie all
    // re-evaluate from the freshly persisted state.
    window.location.href = `${basePath}${onEnabledPath}`;
  };

  return (
    <div className="w-[440px] max-w-full border-2 border-dashed border-foreground bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-foreground">
              Development mode
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Skip sign-in to test gated pages. Dev only.
            </p>
          </div>
        </div>
        <Button onClick={handleLogin} className="shrink-0">
          Log in as test user
        </Button>
      </div>
    </div>
  );
}
