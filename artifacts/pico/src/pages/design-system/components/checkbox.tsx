import { Checkbox } from "@workspace/pico-ui/checkbox";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function CheckboxDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Checkbox
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A control that allows the user to toggle between checked and not checked. Pico checkboxes feature bold borders and a heavy checkmark.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center space-x-2 bg-background p-4 border-2 border-foreground shadow-sm rounded-sm min-w-[200px]">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
          
          <div className="items-top flex space-x-2 bg-background p-4 border-2 border-foreground shadow-sm rounded-sm max-w-sm">
            <Checkbox id="terms1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terms1">
                Accept terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground">
                You agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
        <CodeBlock code={`import { Checkbox } from "@workspace/pico-ui/checkbox"
import { Label } from "@workspace/pico-ui/label"

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`} />
      </section>
    </div>
  );
}
