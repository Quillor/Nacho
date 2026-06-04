import { Link, useLocation } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import {
  LayoutDashboard,
  Users as UsersIcon,
  FolderTree,
  Bell,
  FileText,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/pico-ui/avatar";
import { Button } from "@workspace/pico-ui/button";
import AccessDenied from "@/pages/access-denied";
import { Redirect } from "wouter";

// Mirrors the server-side rule in api-server lib/clerk.ts: this account is
// always a super admin regardless of publicMetadata.role.
const PERMANENT_SUPER_ADMIN_EMAIL = "hello@timrosenberg.com";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: UsersIcon },
  { name: "Groups", href: "/groups", icon: FolderTree },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Content", href: "/content", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  const role = user.publicMetadata?.role;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isPermanentSuperAdmin = email === PERMANENT_SUPER_ADMIN_EMAIL;
  if (role !== "super_admin" && !isPermanentSuperAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-background">
        <div className="flex h-14 items-center border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            Nacho Admin
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-muted text-xs">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {user.fullName || "Admin"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-4 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}
