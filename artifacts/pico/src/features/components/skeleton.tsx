import { Section } from "@/components/docs/shared";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SkeletonDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Skeleton
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A pulsing placeholder that holds the layout while a recording, thumbnail, or transcript loads.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-sm flex items-center space-x-4 bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <Skeleton className="h-16 w-24 rounded-sm" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
        <CodeBlock code={`import { Skeleton } from "@workspace/pico-ui/skeleton"

<div className="flex items-center space-x-4">
  <Skeleton className="h-16 w-24 rounded-sm" />
  <div className="space-y-2 flex-1">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
</div>`} />
      </Section>
    </div>
  );
}
