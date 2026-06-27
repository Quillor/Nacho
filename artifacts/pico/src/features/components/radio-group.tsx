import { Section } from "@/components/docs/shared";
import { RadioGroup, RadioGroupItem } from "@workspace/pico-ui/radio-group";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function RadioGroupDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Radio Group
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A set of mutually exclusive options where exactly one choice can be selected at a time.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <RadioGroup defaultValue="link" className="bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="link" id="link" />
              <Label htmlFor="link">Anyone with the link</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="team" id="team" />
              <Label htmlFor="team">Only my team</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private</Label>
            </div>
          </RadioGroup>
        </div>
        <CodeBlock code={`import { RadioGroup, RadioGroupItem } from "@workspace/pico-ui/radio-group"
import { Label } from "@workspace/pico-ui/label"

<RadioGroup defaultValue="link">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="link" id="link" />
    <Label htmlFor="link">Anyone with the link</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="team" id="team" />
    <Label htmlFor="team">Only my team</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="private" id="private" />
    <Label htmlFor="private">Private</Label>
  </div>
</RadioGroup>`} />
      </Section>
    </div>
  );
}
