import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/pico-ui/drawer";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function DrawerDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Drawer
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A panel that slides up from the bottom — ideal for quick actions and mobile-friendly flows.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Export clip</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Export clip</DrawerTitle>
                  <DrawerDescription>
                    Pick a format and we'll render it for you.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Export MP4</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <CodeBlock code={`import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/pico-ui/drawer"

<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Export clip</Button>
  </DrawerTrigger>
  <DrawerContent>
    <div className="mx-auto w-full max-w-sm">
      <DrawerHeader>
        <DrawerTitle>Export clip</DrawerTitle>
        <DrawerDescription>
          Pick a format and we'll render it for you.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        <Button>Export MP4</Button>
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>`} />
      </section>
    </div>
  );
}
