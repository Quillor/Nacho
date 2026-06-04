import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@workspace/pico-ui/command";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Video, Link2, FileText, Settings } from "lucide-react";

export default function CommandDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Command
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A fast, searchable command palette for jumping to any action without leaving the keyboard.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Command className="max-w-md border-2 border-foreground shadow-sm rounded-sm">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Actions">
                <CommandItem>
                  <Video />
                  <span>Start recording</span>
                  <CommandShortcut>⌘R</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Link2 />
                  <span>Copy link</span>
                  <CommandShortcut>⌘L</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <FileText />
                  <span>Open transcript</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <Settings />
                  <span>Preferences</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <CodeBlock code={`import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@workspace/pico-ui/command"
import { Video, Link2, FileText } from "lucide-react"

<Command>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Actions">
      <CommandItem>
        <Video />
        <span>Start recording</span>
        <CommandShortcut>⌘R</CommandShortcut>
      </CommandItem>
      <CommandItem>
        <Link2 />
        <span>Copy link</span>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      <CommandItem>
        <FileText />
        <span>Open transcript</span>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`} />
      </section>
    </div>
  );
}
