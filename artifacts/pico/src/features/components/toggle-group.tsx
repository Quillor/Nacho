import { Section } from "@/components/docs/shared";
import { ToggleGroup, ToggleGroupItem } from "@workspace/pico-ui/toggle-group";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export default function ToggleGroupDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Toggle Group
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A set of toggle buttons grouped together for picking one or several related options.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ToggleGroup type="single" defaultValue="left" variant="outline">
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CodeBlock code={`import { ToggleGroup, ToggleGroupItem } from "@workspace/pico-ui/toggle-group"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"

<ToggleGroup type="single" defaultValue="left" variant="outline">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight />
  </ToggleGroupItem>
</ToggleGroup>`} />
      </Section>

      <Section title="Multiple">
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Use type="multiple" when more than one option can be active at once.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ToggleGroup type="multiple" defaultValue={["center"]} variant="outline">
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CodeBlock code={`<ToggleGroup type="multiple" defaultValue={["center"]} variant="outline">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight />
  </ToggleGroupItem>
</ToggleGroup>`} />
      </Section>
    </div>
  );
}
