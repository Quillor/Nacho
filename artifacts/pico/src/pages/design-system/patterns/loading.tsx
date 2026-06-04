import { Spinner } from "@workspace/pico-ui/spinner";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Progress } from "@workspace/pico-ui/progress";
import { Button } from "@workspace/pico-ui/button";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function LoadingPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Loading & Progress"
        intro="Pick the right wait by what you know. Don't know how long and don't know the shape? Spinner. Know the shape? Skeleton. Know the percentage? Progress bar. Never leave a frozen screen with no signal."
      />

      <Section title="Spinner — short, inline waits">
        <Note>
          Use a spinner for quick, indeterminate actions inside a button or next
          to a control — saving, signing in, fetching one thing. Keep the
          original label so people know what they're waiting on.
        </Note>
        <Preview className="flex items-center gap-4">
 <Button disabled className="font-bold">
            <Spinner className="mr-2" /> Publishing…
          </Button>
          <span className="inline-flex items-center gap-2 font-medium text-muted-foreground">
            <Spinner /> Loading transcript
          </span>
        </Preview>
      </Section>

      <Section title="Skeleton — first paint of structured content">
        <Note>
          When a list or grid is loading for the first time, show skeletons that
          echo the real layout. It tells people what's coming and stops the page
          from jumping when content lands.
        </Note>
        <Preview>
          <div className="grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-4 border-foreground bg-card">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Preview>
      </Section>

      <Section title="Progress — long actions with a known finish">
        <Note>
          For uploads, exports, or anything with measurable progress, show a
          determinate bar with a percentage or step count. This is the right fit
          for publishing a recording or rendering a GIF.
        </Note>
        <Preview>
          <div className="max-w-md space-y-2">
            <div className="flex justify-between font-bold uppercase text-xs tracking-wide">
              <span>Uploading recording</span>
              <span>64%</span>
            </div>
            <Progress value={64} className="border-2 border-foreground" />
          </div>
        </Preview>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Match the indicator to what you know: skeletons for first load, spinners for inline actions, a determinate bar when you can measure progress."
          dontText="Drop a single centred spinner over a whole page that has structure, or fake a progress bar that crawls without reflecting real work."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Button", href: "/components/button" },
          { title: "Card", href: "/components/card" },
        ]}
      />
    </PatternPage>
  );
}
