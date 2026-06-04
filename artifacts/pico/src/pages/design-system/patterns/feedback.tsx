import { Terminal, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@workspace/pico-ui/alert";
import { Button } from "@workspace/pico-ui/button";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  PatternPage,
  PageHeader,
  Section,
  Preview,
  Note,
  DoDont,
  BuiltWith,
} from "./_shared";

export default function FeedbackPattern() {
  const { toast } = useToast();

  return (
    <PatternPage>
      <PageHeader
        title="Feedback"
        intro="Tell people what happened with the lightest touch that does the job. Toast for the routine, inline alert for context that has to stick, dialog only when you need a decision before anything else continues."
      />

      <Section title="Toast — confirm and move on">
        <Note>
          Use a toast for a transient confirmation of something the user just did:
          link copied, recording deleted, settings saved. It appears, reassures,
          and disappears without blocking. Don't put critical errors here — they
          vanish too fast.
        </Note>
        <Preview className="flex flex-wrap gap-3">
          <Button
            className="font-bold uppercase"
            onClick={() =>
              toast({ title: "Link copied", description: "Share it anywhere." })
            }
          >
            Show success toast
          </Button>
          <Button
            variant="outline"
            className="font-bold uppercase"
            onClick={() =>
              toast({
                title: "Couldn't start recording",
                description: "Permission was denied or no source was selected.",
                variant: "destructive",
              })
            }
          >
            Show error toast
          </Button>
        </Preview>
      </Section>

      <Section title="Inline alert — context that stays">
        <Note>
          Use an inline alert when the message belongs to a specific area and
          needs to remain visible — a browser-support warning on the recorder, a
          validation summary above a form. Default for information, destructive
          for problems.
        </Note>
        <Preview className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              Live captions only work in Chrome and Edge.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We couldn't reach the server. Your recording is still saved
              locally.
            </AlertDescription>
          </Alert>
        </Preview>
      </Section>

      <Section title="Dialog — stop and decide">
        <Note>
          Reserve a dialog for moments where the user must make a choice before
          anything else happens — most often confirming a destructive action.
          Because it blocks the screen, use it sparingly. See the Confirmation
          pattern for the full shape.
        </Note>
      </Section>

      <Section title="Do & Don't">
        <DoDont
          doText="Match weight to stakes: toast for routine confirmations, inline alert for context that must persist, dialog only when a decision blocks progress."
          dontText="Fire a toast for a critical error that needs action, or interrupt people with a modal for something a quiet inline message could say."
        />
      </Section>

      <BuiltWith
        items={[
          { title: "Alert", href: "/components/alert" },
          { title: "Dialog", href: "/components/dialog" },
          { title: "Button", href: "/components/button" },
        ]}
      />
      <Note>
        What the message <em>says</em> matters as much as where it shows — keep
        copy specific and calm per the Content Guidelines.
      </Note>
    </PatternPage>
  );
}
