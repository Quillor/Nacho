import { LogOut } from "lucide-react";
import { useDesktopAuth } from "../desktop-auth";

// Account chip + sign-out for the desktop app shell (no Clerk).
export function DesktopUserControl() {
  const { user, signOut } = useDesktopAuth();
  const label = user?.name || user?.email || "Account";
  const initial = (label.charAt(0) || "?").toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 border border-foreground bg-card px-3 py-1.5 sm:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground bg-accent text-sm font-black text-accent-foreground">
          {initial}
        </div>
        <span
          className="max-w-[12rem] truncate text-sm font-bold"
          title={user?.email ?? label}
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-2 border border-foreground px-3 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:bg-muted"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
