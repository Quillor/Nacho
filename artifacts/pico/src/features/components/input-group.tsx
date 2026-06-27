import { Section } from "@/components/docs/shared";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@workspace/pico-ui/input-group";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Link2, Copy, Search } from "lucide-react";

export default function InputGroupDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Input Group
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Bolt icons, text, or buttons onto an input so they read as one control. Perfect for a share link with a copy button or a search box with a leading icon.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <InputGroup className="w-full max-w-sm border border-foreground">
            <InputGroupAddon>
              <Link2 />
            </InputGroupAddon>
            <InputGroupInput
              readOnly
              value="nacho.so/r/q3-walkthrough"
              className="font-medium"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>
                <Copy />
                Copy link
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <CodeBlock code={`import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/pico-ui/input-group"
import { Link2, Copy } from "lucide-react"

<InputGroup>
  <InputGroupAddon>
    <Link2 />
  </InputGroupAddon>
  <InputGroupInput readOnly value="nacho.so/r/q3-walkthrough" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton>
      <Copy />
      Copy link
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>`} />
      </Section>

      <Section title="With text addon">
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Use <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">InputGroupText</code> for a static prefix or a leading search icon.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <InputGroup className="w-full max-w-sm border border-foreground">
            <InputGroupAddon>
              <Search />
              <InputGroupText>Search</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="Recordings" className="font-medium" />
          </InputGroup>
        </div>
        <CodeBlock code={`<InputGroup>
  <InputGroupAddon>
    <Search />
    <InputGroupText>Search</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="Recordings" />
</InputGroup>`} />
      </Section>
    </div>
  );
}
