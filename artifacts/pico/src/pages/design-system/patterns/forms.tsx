import { AlertCircle } from "lucide-react";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { Textarea } from "@workspace/pico-ui/textarea";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function FormsPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Forms"
        intro="Every field reads top to bottom: label, control, helper, then validation only when something is wrong. Keep one column, keep the rhythm, and put the commit action on the right."
      />

      <Section title="Field anatomy">
        <Note>
          A field is a stack: a bold <strong>Label</strong>, the control, optional
          muted <strong>helper text</strong>, and an inline error that appears
          only after a failed submit. Mark required fields with an asterisk, not
          by labelling the optional ones.
        </Note>
        <Preview className="max-w-md">
          <div className="space-y-5">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input id="title" placeholder="Quarterly walkthrough" />
              <p className="text-xs font-medium text-muted-foreground">
                Shown on the share page and in your library.
              </p>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" placeholder="What's this recording about?" />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="slug" className="text-destructive">
                Custom link <span>*</span>
              </Label>
              <Input
                id="slug"
                defaultValue="my recording"
                aria-invalid
                className="border-destructive focus-visible:ring-destructive"
              />
              <p className="flex items-center gap-1 text-xs font-bold text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Links can't contain spaces.
              </p>
            </div>
          </div>
        </Preview>
        <CodeBlock
          code={`<div className="grid w-full items-center gap-1.5">
  <Label htmlFor="title">
    Title <span className="text-destructive">*</span>
  </Label>
  <Input id="title" placeholder="Quarterly walkthrough" />
  <p className="text-xs font-medium text-muted-foreground">
    Shown on the share page and in your library.
  </p>
</div>`}
        />
      </Section>

      <Section title="Actions">
        <Note>
          Buttons live in a single row, right-aligned. The primary commit action
          is the solid yellow button on the far right; a secondary or cancel
          action sits to its left as an outline or ghost button. Never stack two
          solid primaries — one screen, one obvious next step.
        </Note>
        <Preview>
          <div className="flex justify-end gap-3">
 <Button variant="ghost" className="font-bold">
              Cancel
            </Button>
 <Button className="font-bold">Save changes</Button>
          </div>
        </Preview>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Keep forms in one column, label every control, and reserve error styling for fields that actually failed validation."
          dontText="Spread fields across multiple columns, rely on placeholder text as the label, or turn the whole form red when one field is wrong."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Input", href: "/components/input" },
          { title: "Checkbox", href: "/components/checkbox" },
          { title: "Switch", href: "/components/switch" },
          { title: "Button", href: "/components/button" },
        ]}
      />
      <Note>
        Helper text, error copy, and button labels follow the Content Guidelines —
        say what happened and what to do next, in Pico's plain, friendly voice.
      </Note>
    </PatternPage>
  );
}
