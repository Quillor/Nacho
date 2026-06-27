import { Section } from "@/components/docs/shared";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { Textarea } from "@workspace/pico-ui/textarea";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function InputDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Input & Forms
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Displays a form input field or a component that looks like an input field.
        </p>
      </div>

      <Section title="Input">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 max-w-md space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
        </div>
        <CodeBlock code={`import { Input } from "@workspace/pico-ui/input"
import { Label } from "@workspace/pico-ui/label"

<div className="grid w-full items-center gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>`} />
      </Section>

      <Section title="Disabled State">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 max-w-md space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="disabled">Email</Label>
            <Input disabled type="email" id="disabled" placeholder="Email" />
          </div>
        </div>
        <CodeBlock code={`<Input disabled type="email" placeholder="Email" />`} />
      </Section>

      <Section title="Textarea">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 max-w-md space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
        </div>
        <CodeBlock code={`import { Textarea } from "@workspace/pico-ui/textarea"

<div className="grid w-full items-center gap-1.5">
  <Label htmlFor="message">Message</Label>
  <Textarea placeholder="Type your message here." id="message" />
</div>`} />
      </Section>
    </div>
  );
}
