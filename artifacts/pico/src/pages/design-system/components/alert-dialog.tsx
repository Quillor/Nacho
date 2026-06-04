import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/pico-ui/alert-dialog";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function AlertDialogDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Alert Dialog
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A modal that interrupts to confirm a serious choice. Unlike a Dialog, it traps focus and demands a yes/no answer — use it only for destructive or irreversible actions. The title asks the question, the body names exactly what happens, and the confirm button repeats the verb.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete recording</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this recording?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the local copy from this device. Published share
                  links will keep working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CodeBlock code={`import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/pico-ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete recording</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this recording?</AlertDialogTitle>
      <AlertDialogDescription>
        This removes the local copy from this device. Published
        share links will keep working.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`} />
      </section>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Dialog vs. Alert Dialog</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-4 border-foreground rounded-sm bg-background p-6 shadow-sm">
 <h3 className="font-display text-xl font-black mb-2">Dialog</h3>
            <p className="font-medium leading-relaxed text-foreground/80">
              For routine, reversible tasks — editing a title, filling a short
              form. Dismissable by clicking outside or pressing escape.
            </p>
          </div>
          <div className="border-4 border-foreground rounded-sm bg-background p-6 shadow-sm">
 <h3 className="font-display text-xl font-black mb-2">Alert Dialog</h3>
            <p className="font-medium leading-relaxed text-foreground/80">
              For destructive or irreversible choices — deleting data, removing
              an account. Requires an explicit confirm or cancel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
