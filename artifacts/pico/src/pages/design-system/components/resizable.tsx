import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/pico-ui/resizable";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function ResizableDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Resizable
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Drag the handle to split a workspace into adjustable panels — pair the player with a live transcript and let editors decide how much room each gets.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[240px] w-full max-w-xl border-2 border-foreground shadow-sm rounded-sm bg-card"
          >
            <ResizablePanel defaultSize={60}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-display font-black uppercase text-foreground">Player</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-display font-black uppercase text-foreground">Transcript</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <CodeBlock code={`import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/pico-ui/resizable"

<ResizablePanelGroup direction="horizontal" className="min-h-[240px] border-2 border-foreground rounded-sm">
  <ResizablePanel defaultSize={60}>
    <div className="flex h-full items-center justify-center p-6">Player</div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={40}>
    <div className="flex h-full items-center justify-center p-6">Transcript</div>
  </ResizablePanel>
</ResizablePanelGroup>`} />
      </section>
    </div>
  );
}
