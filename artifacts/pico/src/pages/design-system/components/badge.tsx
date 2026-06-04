import { Badge } from "@workspace/pico-ui/badge";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function BadgeDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Badge
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Displays a badge or a component that looks like a badge. Useful for labels, statuses, and counts.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Variants</h2>
        <div className="flex flex-wrap gap-4 items-center p-8 border-4 border-foreground rounded-sm bg-background/50">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
        <CodeBlock code={`import { Badge } from "@workspace/pico-ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`} />
      </section>

    </div>
  );
}
