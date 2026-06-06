import { Textarea } from "@workspace/pico-ui/textarea";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function TextareaDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Textarea
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A multi-line text field for longer input like recording descriptions and transcript notes.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="description" className="uppercase tracking-wide">Description</Label>
            <Textarea
              id="description"
              className="border border-foreground"
              placeholder="Tell viewers what this recording covers…"
            />
          </div>
        </div>
        <CodeBlock code={`import { Textarea } from "@workspace/pico-ui/textarea"
import { Label } from "@workspace/pico-ui/label"

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    className="border border-foreground"
    placeholder="Tell viewers what this recording covers…"
  />
</div>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Disabled</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="transcript" className="uppercase tracking-wide">Transcript</Label>
            <Textarea
              id="transcript"
              className="border border-foreground"
              defaultValue="Transcript is still processing…"
              disabled
            />
          </div>
        </div>
        <CodeBlock code={`<Textarea
  className="border border-foreground"
  defaultValue="Transcript is still processing…"
  disabled
/>`} />
      </section>
    </div>
  );
}
