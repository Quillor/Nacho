import { Link, useLocation } from "wouter";
import { Video, Library, Settings, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Video;
}

const NAV: NavItem[] = [
  { href: "/studio", label: "Record", icon: CircleDot },
  { href: "/library", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans">
      <nav className="sticky top-0 z-50 border-b-4 border-foreground bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/library"
            className="flex items-center gap-2 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-foreground bg-primary shadow-sm">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-black uppercase tracking-tight">
              Nacho
            </span>
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
                  className={cn(
                    "flex items-center gap-2 border-2 px-4 py-2 font-bold uppercase tracking-wide transition-all",
                    active
                      ? "border-foreground bg-primary text-primary-foreground shadow-sm"
                      : "border-transparent text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
