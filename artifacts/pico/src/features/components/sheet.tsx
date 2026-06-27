import { Section } from "@/components/docs/shared";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/pico-ui/sheet";
import { Button } from "@workspace/pico-ui/button";
import { Label } from "@workspace/pico-ui/label";
import { Input } from "@workspace/pico-ui/input";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function SheetDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Sheet
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A panel that slides in from the edge of the screen for settings, details, or secondary tasks.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Recording settings</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Recording settings</SheetTitle>
                <SheetDescription>
                  Tune your capture before you hit record.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" defaultValue="Weekly standup" />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">Save changes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        <CodeBlock code={`import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/pico-ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Recording settings</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Recording settings</SheetTitle>
      <SheetDescription>
        Tune your capture before you hit record.
      </SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose asChild>
        <Button type="submit">Save changes</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`} />
      </Section>
    </div>
  );
}
