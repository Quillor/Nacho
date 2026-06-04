import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/pico-ui/popover";
import { Button } from "@workspace/pico-ui/button";
import { Label } from "@workspace/pico-ui/label";
import { Input } from "@workspace/pico-ui/input";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function PopoverDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Popover
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A bordered panel that floats next to its trigger to hold quick settings, forms, or extra detail.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Share link</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold leading-none">Share recording</h4>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can watch.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input id="link" defaultValue="nacho.so/r/9fk2" readOnly />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <CodeBlock code={`import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/pico-ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Share link</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-bold">Share recording</h4>
      <Input defaultValue="nacho.so/r/9fk2" readOnly />
    </div>
  </PopoverContent>
</Popover>`} />
      </section>
    </div>
  );
}
