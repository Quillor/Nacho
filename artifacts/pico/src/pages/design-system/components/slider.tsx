import { Slider } from "@workspace/pico-ui/slider";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SliderDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Slider
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Drag along a track to set a value within a range — perfect for playback position or volume.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-md space-y-3">
            <Label className="uppercase tracking-wide">Volume</Label>
            <Slider defaultValue={[60]} max={100} step={1} />
          </div>
        </div>
        <CodeBlock code={`import { Slider } from "@workspace/pico-ui/slider"

<Slider defaultValue={[60]} max={100} step={1} />`} />
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Range</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Pass two values to trim a clip — one thumb for the in point, one for the out point.
        </p>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-md space-y-3">
            <Label className="uppercase tracking-wide">Trim clip</Label>
            <Slider defaultValue={[20, 80]} max={100} step={1} />
          </div>
        </div>
        <CodeBlock code={`<Slider defaultValue={[20, 80]} max={100} step={1} />`} />
      </section>
    </div>
  );
}
