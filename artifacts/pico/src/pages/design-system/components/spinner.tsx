import { Spinner } from "@workspace/pico-ui/spinner";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SpinnerDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Spinner
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          An indeterminate loading indicator for short waits where progress can't be measured.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-background px-4 py-3 border-2 border-foreground shadow-sm rounded-sm">
            <Spinner />
            <span className="text-sm font-bold uppercase tracking-wide">Preparing recording</span>
          </div>
        </div>
        <CodeBlock code={`import { Spinner } from "@workspace/pico-ui/spinner"

<div className="flex items-center gap-3">
  <Spinner />
  <span>Preparing recording</span>
</div>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Sizes</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Resize with a className utility — the spinner inherits the current text color.
        </p>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center gap-6 text-foreground">
          <Spinner className="size-4" />
          <Spinner className="size-6" />
          <Spinner className="size-8" />
        </div>
        <CodeBlock code={`<Spinner className="size-4" />
<Spinner className="size-6" />
<Spinner className="size-8" />`} />
      </section>
    </div>
  );
}
