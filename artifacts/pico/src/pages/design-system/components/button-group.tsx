import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@workspace/pico-ui/button-group";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { SkipBack, Play, SkipForward } from "lucide-react";

export default function ButtonGroupDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Button Group
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Stitch related buttons into a single segmented control with shared borders. Use it for playback transport, view switches, or any tight cluster of actions that belong together.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ButtonGroup>
            <Button variant="outline">
              <SkipBack />
            </Button>
            <Button variant="outline">
              <Play />
              Play
            </Button>
            <Button variant="outline">
              <SkipForward />
            </Button>
          </ButtonGroup>
        </div>
        <CodeBlock code={`import { ButtonGroup } from "@workspace/pico-ui/button-group"
import { Button } from "@workspace/pico-ui/button"
import { SkipBack, Play, SkipForward } from "lucide-react"

<ButtonGroup>
  <Button variant="outline">
    <SkipBack />
  </Button>
  <Button variant="outline">
    <Play />
    Play
  </Button>
  <Button variant="outline">
    <SkipForward />
  </Button>
</ButtonGroup>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">With label and separator</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Drop in <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">ButtonGroupText</code> for a static label and <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">ButtonGroupSeparator</code> to divide intent.
        </p>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <ButtonGroup>
            <ButtonGroupText>Speed</ButtonGroupText>
            <Button variant="outline">1x</Button>
            <ButtonGroupSeparator />
            <Button variant="outline">1.5x</Button>
            <Button variant="outline">2x</Button>
          </ButtonGroup>
        </div>
        <CodeBlock code={`import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@workspace/pico-ui/button-group"

<ButtonGroup>
  <ButtonGroupText>Speed</ButtonGroupText>
  <Button variant="outline">1x</Button>
  <ButtonGroupSeparator />
  <Button variant="outline">1.5x</Button>
  <Button variant="outline">2x</Button>
</ButtonGroup>`} />
      </section>
    </div>
  );
}
