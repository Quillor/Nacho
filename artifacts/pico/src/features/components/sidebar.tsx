import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/pico-ui/sidebar";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Video, Clapperboard, FileText, Settings } from "lucide-react";

export default function SidebarDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Sidebar
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The persistent navigation rail for the Nacho app shell. Group your recordings, chapters, and transcript views into a collapsible, keyboard-friendly panel that anchors the whole workspace.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-72 h-80 overflow-hidden border border-foreground rounded-sm shadow-sm">
            <SidebarProvider className="min-h-full">
              <Sidebar collapsible="none" className="h-80">
 <SidebarHeader className="px-3 py-2 font-display font-extrabold tracking-tight">
                  Nacho
                </SidebarHeader>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Library</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton isActive>
                            <Video />
                            <span>Recordings</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Clapperboard />
                            <span>Chapters</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <FileText />
                            <span>Transcript</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
            </SidebarProvider>
          </div>
        </div>
        <CodeBlock code={`import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/pico-ui/sidebar"
import { Video, Clapperboard, FileText, Settings } from "lucide-react"

<SidebarProvider>
  <Sidebar>
 <SidebarHeader className="px-3 py-2 font-display font-extrabold">
      Nacho
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Library</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <Video />
                <span>Recordings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Clapperboard />
                <span>Chapters</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <FileText />
                <span>Transcript</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</SidebarProvider>`} />
      </section>
    </div>
  );
}
