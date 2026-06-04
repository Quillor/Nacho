import { ScrollArea } from "@workspace/pico-ui/scroll-area";
import { CodeBlock } from "@workspace/pico-ui/code-block";

const chapters = [
  "00:00 — Intro",
  "00:42 — Setting up the project",
  "02:15 — Recording your screen",
  "04:30 — Trimming the timeline",
  "06:10 — Adding captions",
  "08:05 — Sharing a link",
  "09:48 — Privacy settings",
  "11:20 — Embedding the player",
  "13:02 — Analytics overview",
  "15:30 — Wrap up",
];

export default function ScrollAreaDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Scroll Area
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A scrollable container with a styled, on-brand scrollbar — perfect for long transcripts and chapter lists.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ScrollArea className="h-48 w-72 bg-background border-2 border-foreground shadow-sm rounded-sm">
            <div className="p-4 space-y-2">
              <h4 className="font-bold uppercase tracking-wide text-sm">Chapters</h4>
              {chapters.map((chapter) => (
                <p key={chapter} className="text-sm font-medium text-foreground/80">
                  {chapter}
                </p>
              ))}
            </div>
          </ScrollArea>
        </div>
        <CodeBlock code={`import { ScrollArea } from "@workspace/pico-ui/scroll-area"

<ScrollArea className="h-48 w-72">
  <div className="p-4 space-y-2">
    <h4 className="font-bold uppercase tracking-wide text-sm">Chapters</h4>
    <p className="text-sm">00:00 — Intro</p>
    <p className="text-sm">00:42 — Setting up the project</p>
    <p className="text-sm">02:15 — Recording your screen</p>
  </div>
</ScrollArea>`} />
      </section>
    </div>
  );
}
