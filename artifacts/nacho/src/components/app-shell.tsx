import { Link, useLocation } from "wouter";
import { Library, Settings, CircleDot, LogOut, type LucideIcon } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/features/account";
import { isDevAuthBypassEnabled } from "@workspace/shared";
import { isDesktop } from "@/lib/desktop";
import { DesktopUserControl } from "@/features/desktop-auth/components/desktop-user-control";
import { Logo } from "@/components/logo";

// Display-only stand-in shown while the bypass is on and there is no real Clerk
// session. Account-editing surfaces stay guarded on the real user, so this is
// never used to make Clerk API calls.
const DEV_USER = {
  displayName: "Dev User",
  email: "dev-user@nacho.test",
};

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/studio", label: "Studio", icon: CircleDot },
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function UserControl() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const bypass = isDevAuthBypassEnabled();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    (bypass && !user ? DEV_USER.email : undefined);
  const label =
    getDisplayName(user?.unsafeMetadata) ||
    user?.fullName ||
    user?.firstName ||
    email?.split("@")[0] ||
    (bypass && !user ? DEV_USER.displayName : "") ||
    "Account";
  const initial = (label.charAt(0) || "?").toUpperCase();

  // With the bypass on there is no Clerk session to end; just go to sign-in.
  // On desktop (hash routing under app://) navigate via the router instead of a
  // hard redirect, which would land on a non-existent path.
  const handleSignOut = () => {
    if (bypass && !user) {
      setLocation("/sign-in");
      return;
    }
    if (isDesktop) {
      void signOut().then(() => setLocation("/sign-in"));
    } else {
      void signOut({ redirectUrl: basePath || "/" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 border border-foreground bg-card px-3 py-1.5 sm:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground bg-accent text-sm font-black text-accent-foreground">
          {initial}
        </div>
        <span
          className="max-w-[12rem] truncate text-sm font-bold"
          title={email ?? label}
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans">
      <nav data-pico-section="navbar" className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/library"
            className="flex items-center transition-transform hover:-translate-y-0.5"
            aria-label="Nacho home"
          >
            <Logo className="h-9" />
          </Link>

          <div className="flex items-center gap-2">
            {NAV.map((item) => {
              const active =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "flex items-center gap-2 border px-4 py-2 font-bold uppercase tracking-wide transition-all",
                    active
                      ? "border-foreground bg-accent text-accent-foreground shadow-sm"
                      : "border-transparent text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="mx-1 hidden h-8 w-0.5 bg-foreground/20 sm:block" />
            {isDesktop ? <DesktopUserControl /> : <UserControl />}
          </div>
        </div>
      </nav>

      <main data-pico-section="content" className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
