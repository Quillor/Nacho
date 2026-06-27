import { Section } from "@/components/docs/shared";
import { useState } from "react";
import { Calendar } from "@workspace/pico-ui/calendar";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function CalendarDocs() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Calendar
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A date field for picking a day — filter your recordings by date or schedule when a share link expires. Wrap it in a thick border to keep it chunky and on-brand.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="bg-background border border-foreground shadow-sm rounded-sm"
          />
        </div>
        <CodeBlock code={`import { useState } from "react"
import { Calendar } from "@workspace/pico-ui/calendar"

const [date, setDate] = useState<Date | undefined>(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="border border-foreground shadow-sm rounded-sm"
/>`} />
      </Section>
    </div>
  );
}
