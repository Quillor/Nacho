import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@workspace/pico-ui/context-menu";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function ContextMenuDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Context Menu
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A menu of actions revealed by right-clicking an item, keeping shortcuts close to the content they affect.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-40 w-72 items-center justify-center rounded-sm border-2 border-dashed border-foreground text-sm font-bold uppercase tracking-wide">
              Right-click the clip
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuLabel>Untitled clip</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem>
                Copy link
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>Rename</ContextMenuItem>
              <ContextMenuItem>View transcript</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive">
                Delete
                <ContextMenuShortcut>⌫</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <CodeBlock code={`import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@workspace/pico-ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger>Right-click the clip</ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <ContextMenuLabel>Untitled clip</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem>
      Copy link
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>Rename</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`} />
      </section>
    </div>
  );
}
