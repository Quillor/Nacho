import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/pico-ui/select";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SelectDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Select
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Pick one option from a list that's too long for a row of buttons. The trigger shows the current choice; the menu drops a chunky, bordered panel of items. Add a thick border to keep it on-brand.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="w-full max-w-xs space-y-2">
            <Label className="uppercase tracking-wide">Caption language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="border-2 border-foreground font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CodeBlock code={`import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/pico-ui/select"

<Select defaultValue="en">
  <SelectTrigger className="border-2 border-foreground font-bold">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="en">English</SelectItem>
    <SelectItem value="es">Spanish</SelectItem>
    <SelectItem value="fr">French</SelectItem>
  </SelectContent>
</Select>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Placeholder</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          When there's no default, show a placeholder that names the choice — never repeat the label.
        </p>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <Select>
            <SelectTrigger className="w-56 border-2 border-foreground font-bold">
              <SelectValue placeholder="Pick a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CodeBlock code={`<SelectTrigger className="w-56 border-2 border-foreground font-bold">
  <SelectValue placeholder="Pick a language" />
</SelectTrigger>`} />
      </section>
    </div>
  );
}
