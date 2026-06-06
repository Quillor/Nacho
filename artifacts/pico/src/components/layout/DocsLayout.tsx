import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@workspace/pico-ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/pico-ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Moon, Sun } from "lucide-react";

const NAVIGATION = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/installation" },
      { title: "Figma Plugin", href: "/figma-plugin" },
    ]
  },
  {
    title: "Guidelines",
    links: [
      { title: "Voice & Tone", href: "/guidelines/voice-and-tone" },
    ]
  },
  {
    title: "Foundations",
    links: [
      { title: "Logo", href: "/foundations/logo" },
      { title: "Colors", href: "/foundations/colors" },
      { title: "Typography", href: "/foundations/typography" },
      { title: "Spacing", href: "/foundations/spacing" },
      { title: "Shadows", href: "/foundations/shadows" },
      { title: "Radius", href: "/foundations/radius" },
      { title: "Imagery", href: "/foundations/imagery" },
    ]
  },
  {
    title: "Components",
    links: [
      { title: "Accordion", href: "/components/accordion" },
      { title: "Alert", href: "/components/alert" },
      { title: "Alert Dialog", href: "/components/alert-dialog" },
      { title: "Aspect Ratio", href: "/components/aspect-ratio" },
      { title: "Avatar", href: "/components/avatar" },
      { title: "Badge", href: "/components/badge" },
      { title: "Breadcrumb", href: "/components/breadcrumb" },
      { title: "Button", href: "/components/button" },
      { title: "Button Group", href: "/components/button-group" },
      { title: "Calendar", href: "/components/calendar" },
      { title: "Card", href: "/components/card" },
      { title: "Carousel", href: "/components/carousel" },
      { title: "Chart", href: "/components/chart" },
      { title: "Checkbox", href: "/components/checkbox" },
      { title: "Collapsible", href: "/components/collapsible" },
      { title: "Command", href: "/components/command" },
      { title: "Context Menu", href: "/components/context-menu" },
      { title: "Dialog", href: "/components/dialog" },
      { title: "Drawer", href: "/components/drawer" },
      { title: "Dropdown Menu", href: "/components/dropdown-menu" },
      { title: "Empty", href: "/components/empty" },
      { title: "Field", href: "/components/field" },
      { title: "Form", href: "/components/form" },
      { title: "Hover Card", href: "/components/hover-card" },
      { title: "Input", href: "/components/input" },
      { title: "Input Group", href: "/components/input-group" },
      { title: "Input OTP", href: "/components/input-otp" },
      { title: "Item", href: "/components/item" },
      { title: "Kbd", href: "/components/kbd" },
      { title: "Label", href: "/components/label" },
      { title: "Menubar", href: "/components/menubar" },
      { title: "Navigation Menu", href: "/components/navigation-menu" },
      { title: "Pagination", href: "/components/pagination" },
      { title: "Popover", href: "/components/popover" },
      { title: "Progress", href: "/components/progress" },
      { title: "Radio Group", href: "/components/radio-group" },
      { title: "Resizable", href: "/components/resizable" },
      { title: "Scroll Area", href: "/components/scroll-area" },
      { title: "Select", href: "/components/select" },
      { title: "Separator", href: "/components/separator" },
      { title: "Sheet", href: "/components/sheet" },
      { title: "Sidebar", href: "/components/sidebar" },
      { title: "Skeleton", href: "/components/skeleton" },
      { title: "Slider", href: "/components/slider" },
      { title: "Sonner", href: "/components/sonner" },
      { title: "Spinner", href: "/components/spinner" },
      { title: "Switch", href: "/components/switch" },
      { title: "Table", href: "/components/table" },
      { title: "Tabs", href: "/components/tabs" },
      { title: "Textarea", href: "/components/textarea" },
      { title: "Toast", href: "/components/toast" },
      { title: "Toggle", href: "/components/toggle" },
      { title: "Toggle Group", href: "/components/toggle-group" },
      { title: "Tooltip", href: "/components/tooltip" },
    ]
  },
  {
    title: "Patterns",
    links: [
      { title: "Overview", href: "/patterns" },
      { title: "Forms", href: "/patterns/forms" },
      { title: "Layout & Nav", href: "/patterns/layout" },
      { title: "Empty States", href: "/patterns/empty-states" },
      { title: "Loading & Progress", href: "/patterns/loading" },
      { title: "Feedback", href: "/patterns/feedback" },
      { title: "Confirmation", href: "/patterns/confirmation" },
      { title: "Cards & Lists", href: "/patterns/cards-lists" },
      { title: "Overlays", href: "/patterns/overlays" },
    ]
  }
];

type Theme = "light" | "dark";

const THEME_KEY = "pico_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);

  React.useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = React.useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );
  return [theme, toggle];
}

function ThemeToggle({
  theme,
  onToggle,
  className = "",
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border border-foreground bg-background text-foreground shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

/** Returns the nav group title that contains the active route, if any. */
function activeGroupTitle(location: string): string | null {
  for (const group of NAVIGATION) {
    if (group.links.some((l) => l.href === location)) return group.title;
  }
  return null;
}

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [theme, toggleTheme] = useTheme();

  // Each nav group is collapsible. The group containing the current route is
  // open by default so the active page is always reachable; others start closed.
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(() => {
    const active = activeGroupTitle(location);
    return new Set(active ? [active] : [NAVIGATION[0].title]);
  });

  // Keep the active group open as the route changes (without collapsing groups
  // the user opened manually).
  React.useEffect(() => {
    const active = activeGroupTitle(location);
    if (!active) return;
    setOpenGroups((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [location]);

  const setGroupOpen = (title: string, open: boolean) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (open) next.add(title);
      else next.delete(title);
      return next;
    });

  return (
    <SidebarProvider>
      <Sidebar data-pico-section="sidebar" className="border-r-2 border-foreground" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b-2 border-foreground p-6 bg-accent">
          <div className="flex items-start justify-between gap-2">
            <div className="text-accent-foreground">
              <Link href="/" className="font-display font-extrabold text-3xl tracking-tight uppercase text-accent-foreground">
                Pico.
              </Link>
              <div className="font-bold uppercase text-xs tracking-widest mt-1">Design System</div>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-background pt-4">
          {NAVIGATION.map((group) => {
            const isOpen = openGroups.has(group.title);
            return (
              <Collapsible
                key={group.title}
                open={isOpen}
                onOpenChange={(open) => setGroupOpen(group.title, open)}
                className="mb-2"
              >
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between font-display font-extrabold uppercase text-foreground/50 tracking-wider text-sm mb-2 px-4 hover:text-foreground transition-colors">
                      <span>{group.title}</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.links.map((link) => {
                          const isActive = location === link.href;
                          return (
                            <SidebarMenuItem key={link.href} className="px-2">
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={`font-bold uppercase tracking-wide transition-all ${
                                  isActive
                                    ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                                    : "text-foreground hover:bg-accent/20 hover:text-foreground"
                                }`}
                              >
                                <Link href={link.href}>{link.title}</Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background min-h-[100dvh] flex flex-col">
        <header className="md:hidden flex items-center p-4 border-b-2 border-foreground bg-accent">
          <SidebarTrigger className="bg-foreground text-background hover:bg-foreground/90 border border-foreground shadow-xs rounded-sm" />
          <span className="ml-4 font-display font-extrabold text-xl tracking-tight uppercase text-accent-foreground">Pico.</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} className="ml-auto" />
        </header>
        <main data-pico-section="content" className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 lg:p-16 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
