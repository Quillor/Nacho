import { TriangleAlert } from "lucide-react";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

// Persistent, high-contrast banner shown across the admin console whenever
// testing mode (the dev auth bypass) is active, so it's obvious the sign-in +
// super-admin gate is off. Hard-gated behind a dev build via
// isDevAuthBypassEnabled(), so it never renders in production.
export function TestingModeBanner() {
  if (!isDevAuthBypassEnabled()) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b-4 border-foreground bg-accent px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-accent-foreground"
    >
      <TriangleAlert className="h-4 w-4 shrink-0" />
      <span>
        Testing mode — sign-in is bypassed. Turn it off on the sign-in page.
      </span>
    </div>
  );
}
