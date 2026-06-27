import { Section } from "@/components/docs/shared";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@workspace/pico-ui/field";
import { Input } from "@workspace/pico-ui/input";
import { Switch } from "@workspace/pico-ui/switch";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function FieldDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Field
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Layout primitives for building accessible form rows without a form library. Stack a label, control, and description vertically, or go horizontal for toggles. Group related fields with <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">FieldSet</code> and <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">FieldGroup</code>.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <FieldSet className="w-full max-w-sm">
            <FieldLegend className="uppercase tracking-wide">
              Recording settings
            </FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title" className="uppercase tracking-wide">
                  Title
                </FieldLabel>
                <Input
                  id="title"
                  placeholder="Q3 product walkthrough"
                  className="border border-foreground font-medium"
                />
                <FieldDescription>
                  Shown in your library and on the share page.
                </FieldDescription>
              </Field>
              <FieldSeparator />
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Auto-generate transcript</FieldTitle>
                  <FieldDescription>
                    Caption every recording the moment it finishes.
                  </FieldDescription>
                </FieldContent>
                <Switch defaultChecked />
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>
        <CodeBlock code={`import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@workspace/pico-ui/field"
import { Input } from "@workspace/pico-ui/input"
import { Switch } from "@workspace/pico-ui/switch"

<FieldSet>
  <FieldLegend>Recording settings</FieldLegend>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="title">Title</FieldLabel>
      <Input id="title" placeholder="Q3 product walkthrough" />
      <FieldDescription>
        Shown in your library and on the share page.
      </FieldDescription>
    </Field>
    <FieldSeparator />
    <Field orientation="horizontal">
      <FieldContent>
        <FieldTitle>Auto-generate transcript</FieldTitle>
        <FieldDescription>
          Caption every recording the moment it finishes.
        </FieldDescription>
      </FieldContent>
      <Switch defaultChecked />
    </Field>
  </FieldGroup>
</FieldSet>`} />
      </Section>
    </div>
  );
}
