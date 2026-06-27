import { Section } from "@/components/docs/shared";
import { Alert, AlertTitle, AlertDescription } from "@workspace/pico-ui/alert";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Terminal, AlertCircle } from "lucide-react";

export default function AlertDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Alert
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Displays a callout for user attention.
        </p>
      </div>

      <Section title="Default">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components and dependencies to your app using the cli.
            </AlertDescription>
          </Alert>
        </div>
        <CodeBlock code={`import { Alert, AlertDescription, AlertTitle } from "@workspace/pico-ui/alert"
import { Terminal } from "lucide-react"

<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>`} />
      </Section>

      <Section title="Destructive">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        </div>
        <CodeBlock code={`<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>`} />
      </Section>
    </div>
  );
}
