import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@workspace/pico-ui/menubar";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function MenubarDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Menubar
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A desktop-style command bar that lives at the top of the studio. Each menu opens a chunky, bordered panel of actions with keyboard shortcuts — perfect for recording controls and editor commands.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Menubar className="border border-foreground shadow-sm">
            <MenubarMenu>
              <MenubarTrigger className="font-bold">Recording</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Start recording <MenubarShortcut>⌘R</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Pause <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>
                  Copy link <MenubarShortcut>⌘L</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="font-bold">View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Transcript</MenubarItem>
                <MenubarItem>Chapters</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Recordings</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
        <CodeBlock code={`import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from "@workspace/pico-ui/menubar"

<Menubar className="border border-foreground shadow-sm">
  <MenubarMenu>
    <MenubarTrigger className="font-bold">Recording</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        Start recording <MenubarShortcut>⌘R</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Pause <MenubarShortcut>⌘P</MenubarShortcut>
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem>
        Copy link <MenubarShortcut>⌘L</MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger className="font-bold">View</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Transcript</MenubarItem>
      <MenubarItem>Chapters</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Recordings</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`} />
      </section>
    </div>
  );
}
