import { Globe, Lock, Play, Pencil, Share2 } from "lucide-react";
import { Badge } from "@workspace/pico-ui/badge";
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

function DemoCard({ published }: { published: boolean }) {
  return (
    <div className="flex flex-col border-4 border-foreground bg-card shadow-md">
      <div className="relative flex aspect-video w-full items-center justify-center border-b-4 border-foreground bg-muted">
        <Play className="h-9 w-9 text-muted-foreground" />
        <span className="absolute bottom-2 right-2 rounded-sm border-2 border-foreground bg-background px-2 py-0.5 font-mono text-xs font-bold">
          2:14
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          {published ? (
            <Badge className="border-2 border-foreground bg-secondary text-secondary-foreground">
              <Globe className="mr-1 h-3 w-3" /> Published
            </Badge>
          ) : (
            <Badge variant="outline" className="border-2 border-foreground">
              <Lock className="mr-1 h-3 w-3" /> Local
            </Badge>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            2 days ago
          </span>
        </div>
 <h3 className="font-display text-lg font-bold leading-tight">
          Quarterly walkthrough
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-2 border-foreground font-bold"
          >
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          {published && (
            <Button
              size="sm"
              className="border-2 border-foreground bg-primary font-bold text-primary-foreground"
            >
              <Share2 className="mr-1 h-4 w-4" /> Copy
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardsListsPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Cards & Lists"
        intro="Collections render as a responsive grid of identical cards. Each card stacks the same things in the same order — thumbnail, status and timestamp, title, actions — so the eye can scan a whole library at a glance."
      />

      <Section title="The recording card">
        <Note>
          Top to bottom: a thumbnail with the duration pinned in its corner, a
          metadata row pairing a status badge (left) with a relative timestamp
          (right), the title, then the action buttons. Status always reads as a
          badge — published vs. local — never as loose text.
        </Note>
        <Preview>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DemoCard published={false} />
            <DemoCard published />
            <DemoCard published={false} />
          </div>
        </Preview>
      </Section>

      <Section title="Grid behaviour">
        <Note>
          Use one column on mobile, two on tablet, three on desktop, with an even
          gap. Cards are uniform height per row and lift slightly on hover to
          signal they're clickable — the whole thumbnail opens the item, while
          the buttons handle secondary actions.
        </Note>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Keep every card's metadata in the same order and show status as a badge so a long library stays scannable."
          dontText="Reorder fields card to card, mix grid and list styling on one screen, or hide the primary action behind a hover-only menu."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Card", href: "/components/card" },
          { title: "Badge", href: "/components/badge" },
          { title: "Button", href: "/components/button" },
        ]}
      />
    </PatternPage>
  );
}
