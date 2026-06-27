import { Section } from "@/components/docs/shared";
import { Toggle } from "@workspace/pico-ui/toggle";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Mic } from "lucide-react";

export default function ToggleDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Toggle
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A two-state button that stays pressed when on — great for switching a single feature like the microphone.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Toggle aria-label="Toggle microphone" className="border border-foreground">
            <Mic />
            Microphone
          </Toggle>
        </div>
        <CodeBlock code={`import { Toggle } from "@workspace/pico-ui/toggle"
import { Mic } from "lucide-react"

<Toggle aria-label="Toggle microphone" className="border border-foreground">
  <Mic />
  Microphone
</Toggle>`} />
      </Section>

      <Section title="Variants">
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Use the outline variant for standalone controls and show the pressed state with defaultPressed.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center gap-4">
          <Toggle variant="outline" aria-label="Toggle microphone">
            <Mic />
            Mic
          </Toggle>
          <Toggle variant="outline" defaultPressed aria-label="Toggle microphone">
            <Mic />
            Mic on
          </Toggle>
        </div>
        <CodeBlock code={`<Toggle variant="outline">
  <Mic />
  Mic
</Toggle>

<Toggle variant="outline" defaultPressed>
  <Mic />
  Mic on
</Toggle>`} />
      </Section>
    </div>
  );
}
