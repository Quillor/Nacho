import { Section } from "@/components/docs/shared";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/pico-ui/accordion";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function AccordionDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Accordion
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A stack of headers that expand to reveal content one section at a time — ideal for FAQs and dense settings.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Accordion type="single" collapsible className="w-full max-w-md bg-background px-4 border border-foreground shadow-sm rounded-sm">
            <AccordionItem value="formats">
              <AccordionTrigger>What formats can I export?</AccordionTrigger>
              <AccordionContent>
                Export any recording as MP4 or grab a quick GIF for chat.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="transcript">
              <AccordionTrigger>Do you generate a transcript?</AccordionTrigger>
              <AccordionContent>
                Every recording gets an automatic transcript you can edit and search.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="share">
              <AccordionTrigger>How do I share a link?</AccordionTrigger>
              <AccordionContent>
                Hit Copy link to share instantly — viewers don't need an account.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <CodeBlock code={`import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/pico-ui/accordion"

<Accordion type="single" collapsible>
  <AccordionItem value="formats">
    <AccordionTrigger>What formats can I export?</AccordionTrigger>
    <AccordionContent>
      Export any recording as MP4 or grab a quick GIF for chat.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="transcript">
    <AccordionTrigger>Do you generate a transcript?</AccordionTrigger>
    <AccordionContent>
      Every recording gets an automatic transcript you can edit and search.
    </AccordionContent>
  </AccordionItem>
</Accordion>`} />
      </Section>
    </div>
  );
}
