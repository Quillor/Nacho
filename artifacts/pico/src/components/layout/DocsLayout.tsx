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
      { title: "Introduction", href: "/design-system" },
      { title: "Installation", href: "/design-system/installation" },
    ]
  },
  {
    title: "Foundations",
    links: [
      { title: "Colors", href: "/design-system/foundations/colors" },
      { title: "Typography", href: "/design-system/foundations/typography" },
      { title: "Spacing", href: "/design-system/foundations/spacing" },
      { title: "Shadows", href: "/design-system/foundations/shadows" },
      { title: "Radius", href: "/design-system/foundations/radius" },
    ]
  },
  {
    title: "Components",
    links: [
      { title: "Button", href: "/design-system/components/button" },
      { title: "Badge", href: "/design-system/components/badge" },
      { title: "Card", href: "/design-system/components/card" },
      { title: "Input", href: "/design-system/components/input" },
      { title: "Alert", href: "/design-system/components/alert" },
      { title: "Tabs", href: "/design-system/components/tabs" },
      { title: "Switch", href: "/design-system/components/switch" },
      { title: "Checkbox", href: "/design-system/components/checkbox" },
      { title: "Avatar", href: "/design-system/components/avatar" },
      { title: "Dialog", href: "/design-system/components/dialog" },
    ]
  }
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <Sidebar className="border-r-4 border-foreground" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b-4 border-foreground p-6 bg-primary">
          <Link href="/design-system" className="font-display font-black text-3xl tracking-tight uppercase text-foreground">
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
