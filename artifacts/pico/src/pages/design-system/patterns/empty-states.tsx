import { CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function EmptyStatesPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Empty States"
        intro="An empty screen is a chance, not a dead end. Every empty state is the same four-part stack: an icon, a short heading, one supporting line, and a single primary action that fills the void."
      />

      <Section title="Anatomy">
        <Note>
          Centre everything inside a dashed bordered panel so it reads as a
          placeholder rather than broken content. The icon sits in a chunky
          circle, the heading names the situation, the line below says why it's
          empty, and the button does the obvious thing about it.
        </Note>
        <Preview>
          <div className="flex flex-col items-center justify-center border-4 border-dashed border-foreground bg-card py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-foreground bg-primary shadow-md">
              <CircleDot className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="font-display text-3xl font-black uppercase">
              No recordings yet
            </h3>
            <p className="mt-2 max-w-md font-medium text-muted-foreground">
              Hit record, talk it out, and your video will show up right here.
            </p>
            <Button size="lg" className="mt-8 font-bold uppercase">
              Start Recording
            </Button>
          </div>
        </Preview>
        <CodeBlock
          code={`<div className="flex flex-col items-center justify-center border-4 border-dashed border-foreground bg-card py-16 text-center">
  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-foreground bg-primary shadow-md">
    <CircleDot className="h-10 w-10 text-primary-foreground" />
  </div>
  <h3 className="font-display text-3xl font-black uppercase">No recordings yet</h3>
  <p className="mt-2 max-w-md font-medium text-muted-foreground">
    Hit record, talk it out, and your video will show up right here.
  </p>
  <Button size="lg" className="mt-8">Start Recording</Button>
</div>`}
        />
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Give every empty state one clear primary action and copy that tells people exactly what to do to fill it."
          dontText="Leave a blank area, show only 'No data', or offer three competing actions that bury the obvious next step."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Button", href: "/components/button" },
          { title: "Card", href: "/components/card" },
        ]}
      />
      <Note>
        First-run and zero-result empty states share this shape but differ in
        copy — see the Content Guidelines for encouraging, blame-free wording.
      </Note>
    </PatternPage>
  );
}
