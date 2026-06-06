import { Kbd, KbdGroup } from "@workspace/pico-ui/kbd";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function KbdDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Kbd
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Renders keyboard keys and shortcuts so people can learn the fast way to record and share.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <Kbd>⌘</Kbd>
          </div>
        </div>
        <CodeBlock code={`import { Kbd } from "@workspace/pico-ui/kbd"

<Kbd>⌘</Kbd>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Shortcuts</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Combine keys with <code>KbdGroup</code> to show a full shortcut for an action.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="flex flex-col gap-3 bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm font-bold uppercase tracking-wide">Start recording</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>R</Kbd>
              </KbdGroup>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm font-bold uppercase tracking-wide">Copy link</span>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>L</Kbd>
              </KbdGroup>
            </div>
          </div>
        </div>
        <CodeBlock code={`import { Kbd, KbdGroup } from "@workspace/pico-ui/kbd"

<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>⇧</Kbd>
  <Kbd>R</Kbd>
</KbdGroup>`} />
      </section>
    </div>
  );
}
