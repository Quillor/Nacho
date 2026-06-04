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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function ConfirmationPattern() {
  return (
    <PatternPage>
      <PageHeader
        title="Confirmation & Destructive Actions"
        intro="Anything you can't undo gets a confirm step. The dialog names exactly what will happen, the destructive button repeats the verb, and cancel is always the easy, safe way out."
      />

      <Section title="The confirm dialog">
        <Note>
          Title asks the question. The body spells out the consequence — what's
          removed, what survives — so there are no surprises. Cancel sits on the
          left as a quiet outline; the destructive action sits on the right in
          red and names the verb (<strong>Delete</strong>, not <strong>OK</strong>).
        </Note>
        <Preview className="flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-2 border-foreground font-bold uppercase text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete recording
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-4 border-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display uppercase">
                  Delete this recording?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the local copy from this device. Published share
                  links will keep working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-2 border-foreground font-bold">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction className="border-2 border-foreground bg-destructive font-bold text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Preview>
      </Section>

      <Section title="Button hierarchy">
        <Note>
          The destructive action is visually the loud one (solid red) but
          positioned so it's never the accidental default — cancel is what a
          stray Enter or Escape lands on. For the truly irreversible (deleting an
          account), raise the friction: red border on the whole panel and an
          explicit warning.
        </Note>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Name the exact consequence in the body and label the action button with its verb so the choice is unambiguous."
          dontText="Use vague 'Are you sure?' copy with generic OK / Cancel buttons, or make the destructive button the calm default."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Dialog", href: "/components/dialog" },
          { title: "Button", href: "/components/button" },
          { title: "Alert", href: "/components/alert" },
        ]}
      />
      <Note>
        Confirmation copy is high-stakes — follow the Content Guidelines for clear,
        non-alarming wording that still makes the consequence obvious.
      </Note>
    </PatternPage>
  );
}
