import { Video, CircleDot, Library, Settings, ChevronLeft } from "lucide-react";
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

export default function LayoutPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Layout & Navigation"
        intro="One app shell wraps every signed-in screen: a sticky top bar with the logo and primary nav, then a page header that names where you are and offers the main action. Predictable scaffolding, loud content."
      />

      <Section title="App shell">
        <Note>
          The top bar is sticky, sits on a thick bottom border, and holds three
          things: the brand mark (links home), the primary nav, and account
          controls. The active route is filled solid; everything else is quiet
          until hovered.
        </Note>
        <Preview className="!p-0 overflow-hidden">
          <div className="border-b-2 border-foreground bg-background">
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-foreground bg-accent shadow-sm">
                  <Video className="h-5 w-5 text-accent-foreground" />
                </div>
 <span className="font-display text-xl font-extrabold tracking-tight">
                  Nacho
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 border border-foreground bg-accent px-3 py-1.5 font-bold uppercase text-xs tracking-wide text-accent-foreground shadow-sm">
                  <CircleDot className="h-4 w-4" /> Record
                </span>
                <span className="flex items-center gap-2 border border-transparent px-3 py-1.5 font-bold uppercase text-xs tracking-wide">
                  <Library className="h-4 w-4" /> Library
                </span>
                <span className="flex items-center gap-2 border border-transparent px-3 py-1.5 font-bold uppercase text-xs tracking-wide">
                  <Settings className="h-4 w-4" /> Settings
                </span>
              </div>
            </div>
          </div>
          <div className="p-6 bg-background/50">
            <span className="font-display text-sm font-bold uppercase text-foreground/40">
              Page content
            </span>
          </div>
        </Preview>
      </Section>

      <Section title="Page header">
        <Note>
          Every page opens the same way: a big display title, a one-line subtitle
          that explains the page in plain language, and — when there's a primary
          action — a button pinned to the right of that row.
        </Note>
        <Preview>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
 <h3 className="font-display text-4xl font-extrabold tracking-tight">
                Your Library
              </h3>
              <p className="mt-2 font-medium text-muted-foreground">
                Every recording lives on this device until you publish it.
              </p>
            </div>
 <Button className="font-bold">
              <CircleDot className="mr-2 h-4 w-4" /> New Recording
            </Button>
          </div>
        </Preview>
      </Section>

      <Section title="Back navigation">
        <Note>
          When a screen is a detail view of something else (an editor opened from
          the library), give it a single, clearly labelled back link at the top
          left. Send people back where they came from — don't make them hunt
          through the nav.
        </Note>
        <Preview>
          <button className="inline-flex items-center gap-1 border border-foreground bg-card px-3 py-1.5 font-bold uppercase text-xs tracking-wide shadow-sm">
            <ChevronLeft className="h-4 w-4" /> Back to library
          </button>
        </Preview>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Reuse the one app shell on every signed-in page and mark the active route with the solid fill so people always know where they are."
          dontText="Hand-roll a new header per screen or leave the active nav item looking the same as the inactive ones."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Button", href: "/components/button" },
          { title: "Avatar", href: "/components/avatar" },
          { title: "Tabs", href: "/components/tabs" },
        ]}
      />
    </PatternPage>
  );
}
