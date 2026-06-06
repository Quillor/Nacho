import { Toaster } from "@workspace/pico-ui/sonner";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { toast } from "sonner";

export default function SonnerDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Sonner
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          An opinionated toast renderer built on Sonner. Fire a message from anywhere with the <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">toast</code> function and let the stacked, theme-aware notifications confirm what just happened.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Button
            onClick={() =>
              toast("Link copied", {
                description: "Share it anywhere.",
              })
            }
          >
            Copy link
          </Button>
          <Toaster />
        </div>
        <CodeBlock code={`import { toast } from "sonner"
import { Button } from "@workspace/pico-ui/button"

<Button
  onClick={() =>
    toast("Link copied", {
      description: "Share it anywhere.",
    })
  }
>
  Copy link
</Button>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">With an action</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Attach an action button for a quick follow-up — like undoing a delete from your recordings.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Button
            variant="outline"
            onClick={() =>
              toast("Recording deleted", {
                description: "Q3 product walkthrough was removed.",
                action: {
                  label: "Undo",
                  onClick: () => {},
                },
              })
            }
          >
            Delete recording
          </Button>
        </div>
        <CodeBlock code={`toast("Recording deleted", {
  description: "Q3 product walkthrough was removed.",
  action: {
    label: "Undo",
    onClick: () => restoreRecording(),
  },
})`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Setup</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Mount the <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">{"<Toaster />"}</code> once near the root of your app so toasts have somewhere to render.
        </p>
        <CodeBlock code={`import { Toaster } from "@workspace/pico-ui/sonner"

function App() {
  return (
    <>
      {/* ...your app... */}
      <Toaster />
    </>
  )
}`} />
      </section>
    </div>
  );
}
