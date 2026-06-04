import { Separator } from "@workspace/pico-ui/separator";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SeparatorDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Separator
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A simple divider that visually or semantically splits content into clear, scannable groups.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-xs bg-background p-6 border-2 border-foreground shadow-sm rounded-sm">
            <div className="space-y-1">
              <h4 className="text-sm font-bold leading-none uppercase tracking-wide">Recording</h4>
              <p className="text-sm text-foreground/70">Manage your latest capture.</p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm font-medium">
              <span>Edit</span>
              <Separator orientation="vertical" />
              <span>Share</span>
              <Separator orientation="vertical" />
              <span>Delete</span>
            </div>
          </div>
        </div>
        <CodeBlock code={`import { Separator } from "@workspace/pico-ui/separator"

<div>
  <h4>Recording</h4>
  <p>Manage your latest capture.</p>
  <Separator className="my-4" />
  <div className="flex h-5 items-center space-x-4">
    <span>Edit</span>
    <Separator orientation="vertical" />
    <span>Share</span>
    <Separator orientation="vertical" />
    <span>Delete</span>
  </div>
</div>`} />
      </section>
    </div>
  );
}
