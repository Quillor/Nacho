import { Switch } from "@workspace/pico-ui/switch";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SwitchDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Switch
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A control that allows the user to toggle between checked and not checked.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-background p-4 border-2 border-foreground shadow-sm rounded-sm">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
        </div>
        <CodeBlock code={`import { Switch } from "@workspace/pico-ui/switch"
import { Label } from "@workspace/pico-ui/label"

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`} />
      </section>
    </div>
  );
}
