import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/pico-ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/pico-ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/pico-ui/drawer";
import { Button } from "@workspace/pico-ui/button";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function OverlaysPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Modals, Sheets & Drawers"
        intro="Three ways to layer content over the page, chosen by job. A dialog for a focused, self-contained task. A sheet for side panels of secondary detail. A drawer for mobile-friendly actions that slide up from the bottom."
      />

      <Section title="Choosing the right overlay">
        <div className="overflow-x-auto border-4 border-foreground rounded-sm">
          <table className="w-full text-left">
            <thead className="bg-foreground text-background font-display uppercase text-sm">
              <tr>
                <th className="px-4 py-3">Overlay</th>
                <th className="px-4 py-3">Reach for it when</th>
              </tr>
            </thead>
            <tbody className="font-medium text-foreground/80">
              <tr className="border-b-2 border-foreground/20">
                <td className="px-4 py-3 font-bold uppercase">Dialog</td>
                <td className="px-4 py-3">
                  A short, focused task or decision — edit a title, confirm an
                  action. Blocks the page until resolved.
                </td>
              </tr>
              <tr className="border-b-2 border-foreground/20">
                <td className="px-4 py-3 font-bold uppercase">Sheet</td>
                <td className="px-4 py-3">
                  Secondary detail or settings alongside the main view — filters,
                  a transcript panel. Slides in from the edge.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold uppercase">Drawer</td>
                <td className="px-4 py-3">
                  Touch-first action menus on small screens. Slides up from the
                  bottom within thumb reach.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Live examples">
        <Note>
          All three share the same skeleton — a header with a title and a
          description, then the body, then any actions — so they feel like one
          family no matter which side they enter from.
        </Note>
        <Preview className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="font-bold uppercase">Open dialog</Button>
            </DialogTrigger>
            <DialogContent className="border-4 border-foreground">
              <DialogHeader>
                <DialogTitle className="font-display uppercase">
                  Rename recording
                </DialogTitle>
                <DialogDescription>
                  A focused task — make the change and close.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button className="font-bold uppercase">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="font-bold uppercase">
                Open sheet
              </Button>
            </SheetTrigger>
            <SheetContent className="border-l-4 border-foreground">
              <SheetHeader>
                <SheetTitle className="font-display uppercase">
                  Transcript
                </SheetTitle>
                <SheetDescription>
                  Secondary detail beside the main view.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="font-bold uppercase">
                Open drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent className="border-t-4 border-foreground">
              <DrawerHeader>
                <DrawerTitle className="font-display uppercase">
                  Recording actions
                </DrawerTitle>
                <DrawerDescription>
                  Touch-friendly actions from the bottom.
                </DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
        </Preview>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Pick the overlay by job — dialog for focused tasks, sheet for side detail, drawer for mobile actions — and give them all the same header / body / actions structure."
          dontText="Nest overlays inside each other, cram a whole multi-step flow into a tiny dialog, or use a sheet where a full page would serve the content better."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Dialog", href: "/components/dialog" },
          { title: "Button", href: "/components/button" },
        ]}
      />
    </PatternPage>
  );
}
