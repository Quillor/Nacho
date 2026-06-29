import { useState } from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/pico-ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

/** The public marketing pages, used to highlight the active nav/footer link. */
export type MarketingPage = "download" | "shop" | "terms" | "built-by-tim";

const NAV_LINKS: { href: string; label: string; page: MarketingPage }[] = [
  { href: "/download", label: "Download", page: "download" },
  { href: "/shop", label: "Shop", page: "shop" },
  { href: "/terms", label: "Terms", page: "terms" },
  { href: "/built-by-tim", label: "Built by Tim", page: "built-by-tim" },
];

interface MarketingChromeProps {
  /** Marks the matching link as the current page. */
  active?: MarketingPage;
}

/**
 * The shared top navigation bar for every public marketing page. Keeps the Pico
 * "chunky" styling and the `data-pico-section="navbar"` marker. The Design
 * System (Pico) link is set apart from the normal page links and opens in a new
 * tab because it is an internal/dev resource.
 */
export function MarketingNav({ active }: MarketingChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      data-pico-section="navbar"
      className="fixed top-0 left-0 right-0 z-50 border-b-2 border-foreground bg-background py-4 px-6 md:px-12 flex items-center justify-between"
    >
      <Link href="/" className="flex items-center" aria-label="Nacho home">
        <Logo className="h-9" />
      </Link>
      <div className="flex items-center gap-2 md:gap-3">
        {NAV_LINKS.map((item) => (
          <Button
            key={item.page}
            asChild
            variant="ghost"
            className={cn("hidden md:flex", active === item.page && "font-bold")}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}

        {/* Internal/dev resource — set apart and opens in a new tab. */}
        <a
          href="/design-system/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center font-bold text-sm text-foreground/60 hover:text-foreground hover:underline transition-colors border-l-2 border-foreground/20 pl-3 ml-1"
        >
          Design System ↗
        </a>

        <Button asChild variant="ghost" className="hidden md:flex">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild variant="brand">
          <Link href="/sign-up">Get Started</Link>
        </Button>

        {/* Mobile menu — surfaces the full nav on small screens. */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-3/4 max-w-xs border-l-2 border-foreground"
          >
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <Button
                  key={item.page}
                  asChild
                  variant="ghost"
                  className={cn(
                    "justify-start text-base",
                    active === item.page && "font-bold",
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}

              <Button
                asChild
                variant="ghost"
                className="justify-start text-base"
                onClick={() => setMenuOpen(false)}
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>

              {/* Internal/dev resource — set apart and opens in a new tab. */}
              <a
                href="/design-system/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center font-bold text-sm text-foreground/60 hover:text-foreground hover:underline transition-colors border-t-2 border-foreground/20 pt-4 px-4"
              >
                Design System ↗
              </a>

              <Button
                asChild
                variant="brand"
                className="mt-4"
                onClick={() => setMenuOpen(false)}
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

/**
 * The shared marketing footer. Mobile responsive — the link row wraps cleanly
 * and stays centered on small screens instead of overflowing. Keeps the
 * `data-pico-section="footer"` marker.
 */
export function MarketingFooter({ active }: MarketingChromeProps) {
  return (
    <footer
      data-pico-section="footer"
      className="py-12 px-6 md:px-12 border-t-2 border-foreground bg-background text-foreground"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <Link href="/" className="flex items-center" aria-label="Nacho home">
          <Logo className="h-10" />
        </Link>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-bold text-foreground/80">
          <a
            href="#"
            className="hover:text-foreground hover:underline transition-colors"
          >
            Twitter
          </a>
          <a
            href="#"
            className="hover:text-foreground hover:underline transition-colors"
          >
            LinkedIn
          </a>
          {NAV_LINKS.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              className={cn(
                "hover:text-foreground hover:underline transition-colors",
                active === item.page && "text-foreground underline",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/design-system/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline transition-colors"
          >
            Design System ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
