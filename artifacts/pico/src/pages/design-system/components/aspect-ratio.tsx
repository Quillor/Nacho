import { AspectRatio } from "@workspace/pico-ui/aspect-ratio";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Play } from "lucide-react";

export default function AspectRatioDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Aspect Ratio
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Locks content to a fixed width-to-height ratio so video thumbnails and embeds never jump around.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-md">
            <AspectRatio ratio={16 / 9}>
              <div className="h-full w-full flex items-center justify-center bg-primary border-2 border-foreground shadow-sm rounded-sm">
                <Play className="h-10 w-10 text-primary-foreground" />
              </div>
            </AspectRatio>
          </div>
        </div>
        <CodeBlock code={`import { AspectRatio } from "@workspace/pico-ui/aspect-ratio"
import { Play } from "lucide-react"

<AspectRatio ratio={16 / 9}>
  <div className="h-full w-full flex items-center justify-center bg-primary rounded-sm">
    <Play className="h-10 w-10 text-primary-foreground" />
  </div>
</AspectRatio>`} />
      </section>
    </div>
  );
}
