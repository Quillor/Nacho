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
} from "@/components/ui/sidebar";
import { motion, AnimatePresence } from "framer-motion";

const NAVIGATION = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/installation" },
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
      { title: "Button", href: "/components/button" },
      { title: "Badge", href: "/components/badge" },
      { title: "Card", href: "/components/card" },
      { title: "Input", href: "/components/input" },
      { title: "Alert", href: "/components/alert" },
      { title: "Tabs", href: "/components/tabs" },
      { title: "Switch", href: "/components/switch" },
      { title: "Checkbox", href: "/components/checkbox" },
      { title: "Avatar", href: "/components/avatar" },
      { title: "Dialog", href: "/components/dialog" },
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

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <Sidebar className="border-r-4 border-foreground" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b-4 border-foreground p-6 bg-primary">
          <Link href="/" className="font-display font-black text-3xl tracking-tight uppercase text-foreground">
            Pico.
          </Link>
          <div className="font-bold uppercase text-xs tracking-widest mt-1">Design System</div>
        </SidebarHeader>
        <SidebarContent className="bg-background pt-4">
          {NAVIGATION.map((group) => (
            <SidebarGroup key={group.title} className="mb-6">
              <SidebarGroupLabel className="font-display font-black uppercase text-foreground/50 tracking-wider text-sm mb-2 px-4">
                {group.title}
              </SidebarGroupLabel>
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
                              : "text-foreground hover:bg-primary/20 hover:text-foreground"
                          }`}
                        >
                          <Link href={link.href}>{link.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background min-h-[100dvh] flex flex-col">
        <header className="md:hidden flex items-center p-4 border-b-4 border-foreground bg-primary">
          <SidebarTrigger className="bg-foreground text-background hover:bg-foreground/90 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm" />
          <span className="ml-4 font-display font-black text-xl tracking-tight uppercase">Pico.</span>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 lg:p-16 overflow-x-hidden">
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
