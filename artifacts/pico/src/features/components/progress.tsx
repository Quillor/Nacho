import { Section } from "@/components/docs/shared";
import { Progress } from "@workspace/pico-ui/progress";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function ProgressDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Progress
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A determinate bar that shows how far along a task is — perfect for uploads, exports, and transcription.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-2 bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wide">
              <span>Uploading</span>
              <span>66%</span>
            </div>
            <Progress value={66} />
          </div>
        </div>
        <CodeBlock code={`import { Progress } from "@workspace/pico-ui/progress"

<Progress value={66} />`} />
      </Section>

      <Section title="Values">
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Set <code>value</code> from 0 to 100 to reflect the real state of the task.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <Progress value={20} />
            <Progress value={50} />
            <Progress value={90} />
          </div>
        </div>
        <CodeBlock code={`<Progress value={20} />
<Progress value={50} />
<Progress value={90} />`} />
      </Section>
    </div>
  );
}
