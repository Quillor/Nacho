import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/pico-ui/collapsible";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { ChevronsUpDown } from "lucide-react";

export default function CollapsibleDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Collapsible
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A single section that expands and collapses on demand — great for hiding secondary details until needed.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Collapsible className="w-full max-w-sm space-y-2 bg-background p-4 border-2 border-foreground shadow-sm rounded-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wide">Recording details</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="text-sm font-medium">Standup-recap.mp4</div>
            <CollapsibleContent className="space-y-2">
              <div className="text-sm text-foreground/70">Duration · 2:14</div>
              <div className="text-sm text-foreground/70">Captions · English</div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <CodeBlock code={`import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/pico-ui/collapsible"
import { Button } from "@workspace/pico-ui/button"
import { ChevronsUpDown } from "lucide-react"

<Collapsible>
  <div className="flex items-center justify-between">
    <h4>Recording details</h4>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="w-9 p-0">
        <ChevronsUpDown className="h-4 w-4" />
      </Button>
    </CollapsibleTrigger>
  </div>
  <div>Standup-recap.mp4</div>
  <CollapsibleContent>
    <div>Duration · 2:14</div>
    <div>Captions · English</div>
  </CollapsibleContent>
</Collapsible>`} />
      </section>
    </div>
  );
}
