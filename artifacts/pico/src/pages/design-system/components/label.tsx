import { Label } from "@workspace/pico-ui/label";
import { Input } from "@workspace/pico-ui/input";
import { Switch } from "@workspace/pico-ui/switch";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function LabelDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Label
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Names a form control so it's clear what to type — and clickable to focus the field. Pair it with every input, switch, or select. Labels are short nouns, set in UPPERCASE to match the chunky type.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="email" className="uppercase tracking-wide">Display name</Label>
            <Input id="email" placeholder="Jane Doe" className="border-2 border-foreground" />
            <p className="text-sm text-muted-foreground">Shown in the app instead of your email.</p>
          </div>
        </div>
        <CodeBlock code={`import { Label } from "@workspace/pico-ui/label"
import { Input } from "@workspace/pico-ui/input"

<div className="space-y-2">
  <Label htmlFor="name" className="uppercase tracking-wide">Display name</Label>
  <Input id="name" placeholder="Jane Doe" />
</div>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">With a control</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="flex items-center gap-3 bg-background p-4 border-2 border-foreground shadow-sm rounded-sm">
            <Switch id="captions" defaultChecked />
            <Label htmlFor="captions">Live captions</Label>
          </div>
        </div>
        <CodeBlock code={`<div className="flex items-center gap-3">
  <Switch id="captions" />
  <Label htmlFor="captions">Live captions</Label>
</div>`} />
      </section>
    </div>
  );
}
