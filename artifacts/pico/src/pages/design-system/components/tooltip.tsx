import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@workspace/pico-ui/tooltip";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function TooltipDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Tooltip
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A floating label that explains an icon or action when you hover or focus the trigger.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Start recording</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Capture your screen in one click</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CodeBlock code={`import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@workspace/pico-ui/tooltip"

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Start recording</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Capture your screen in one click</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`} />
      </section>
    </div>
  );
}
