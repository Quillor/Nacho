import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@workspace/pico-ui/empty";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Video } from "lucide-react";

export default function EmptyDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Empty
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A friendly placeholder for empty lists — tell people what's missing and what to do next.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Empty className="bg-background border-2 border-foreground shadow-sm rounded-sm max-w-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Video />
              </EmptyMedia>
              <EmptyTitle>No recordings yet</EmptyTitle>
              <EmptyDescription>
                Your library is empty. Hit record to capture your first walkthrough.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>Start recording</Button>
            </EmptyContent>
          </Empty>
        </div>
        <CodeBlock code={`import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@workspace/pico-ui/empty"
import { Button } from "@workspace/pico-ui/button"
import { Video } from "lucide-react"

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <Video />
    </EmptyMedia>
    <EmptyTitle>No recordings yet</EmptyTitle>
    <EmptyDescription>
      Your library is empty. Hit record to capture your first walkthrough.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Start recording</Button>
  </EmptyContent>
</Empty>`} />
      </section>
    </div>
  );
}
