import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";

export default function ToastDocs() {
  const { toast } = useToast();

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Toast
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A brief, self-dismissing message that confirms something happened without stealing focus. Fire it with the <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">useToast</code> hook. Keep it glanceable — past-tense for done, present-tense for happening.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <Button
            onClick={() =>
              toast({
                title: "Link copied",
                description: "Share it anywhere.",
              })
            }
          >
            Copy link
          </Button>
        </div>
        <CodeBlock code={`import { useToast } from "@workspace/pico-ui/hooks/use-toast"

function CopyButton() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() =>
        toast({
          title: "Link copied",
          description: "Share it anywhere.",
        })
      }
    >
      Copy link
    </Button>
  )
}`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Destructive</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Use the destructive variant for failures. Drop the jokes, never blame the user, and say the one thing they can try next.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <Button
            variant="destructive"
            onClick={() =>
              toast({
                variant: "destructive",
                title: "Publish failed",
                description: "Something went wrong uploading — give it another go.",
              })
            }
          >
            Trigger error
          </Button>
        </div>
        <CodeBlock code={`toast({
  variant: "destructive",
  title: "Publish failed",
  description: "Something went wrong uploading — give it another go.",
})`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-2 border-foreground pb-2">Setup</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Mount the <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">{"<Toaster />"}</code> once near the root of your app so toasts have somewhere to render.
        </p>
        <CodeBlock code={`import { Toaster } from "@workspace/pico-ui/toaster"

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
