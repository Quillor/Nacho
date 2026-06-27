import { Section } from "@/components/docs/shared";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { ArrowRight, Mail } from "lucide-react";

export default function ButtonDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Button
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Displays a button or a component that looks like a button. Our buttons are chunky, highly interactive, and come with a satisfying press effect.
        </p>
      </div>

      <Section title="Variants">
        <div className="flex flex-wrap gap-4 items-center p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Button>Default</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <CodeBlock code={`import { Button } from "@workspace/pico-ui/button"

<Button>Default</Button>
<Button variant="brand">Brand</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`} />
      </Section>

      <Section title="Brand">
        <p className="text-lg max-w-2xl font-medium leading-relaxed text-foreground/80">
          The chunky marketing CTA: solid yellow fill, heavy brown border, and the chunky offset shadow that presses down on hover. Use it for the loudest primary action on a light surface — landing-page sign-up, hero calls to action.
        </p>
        <div className="flex flex-wrap gap-4 items-center p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Button variant="brand">Start Recording Free</Button>
          <Button variant="brand" size="lg">Get Started</Button>
        </div>
        <CodeBlock code={`<Button variant="brand">Start Recording Free</Button>
<Button variant="brand" size="lg">Get Started</Button>`} />
      </Section>

      <Section title="Sizes">
        <div className="flex flex-wrap gap-4 items-center p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><ArrowRight className="w-4 h-4" /></Button>
        </div>
        <CodeBlock code={`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><ArrowRight /></Button>`} />
      </Section>

      <Section title="With Icon">
        <div className="flex flex-wrap gap-4 items-center p-8 border-2 border-foreground rounded-sm bg-background/50">
          <Button>
            <Mail className="w-4 h-4 mr-2" /> Login with Email
          </Button>
        </div>
        <CodeBlock code={`<Button>
  <Mail className="w-4 h-4 mr-2" /> Login with Email
</Button>`} />
      </Section>
    </div>
  );
}
