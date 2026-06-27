import { Section } from "@/components/docs/shared";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/pico-ui/hover-card";
import { Button } from "@workspace/pico-ui/button";
import { Avatar, AvatarFallback } from "@workspace/pico-ui/avatar";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function HoverCardDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Hover Card
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A preview panel that appears on hover to surface extra context without leaving the page.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@maya</Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback>MA</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-bold">Maya Alvarez</h4>
                  <p className="text-sm text-muted-foreground">
                    Shared 12 recordings this week.
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <CodeBlock code={`import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/pico-ui/hover-card"

<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">@maya</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback>MA</AvatarFallback>
      </Avatar>
      <div>
        <h4 className="font-bold">Maya Alvarez</h4>
        <p className="text-sm text-muted-foreground">
          Shared 12 recordings this week.
        </p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`} />
      </Section>
    </div>
  );
}
