import { Section } from "@/components/docs/shared";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/pico-ui/carousel";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function CarouselDocs() {
  const recordings = ["Onboarding walkthrough", "Bug repro #482", "Sprint demo", "Design review"];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Carousel
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Swipe through a row of items one screen at a time — great for flicking between recent recordings or chapter thumbnails. Arrows sit just outside the frame.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {recordings.map((title, index) => (
                <CarouselItem key={index}>
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 border border-foreground rounded-sm bg-card shadow-sm p-6">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Recording {index + 1}
                    </span>
 <span className="text-lg font-display font-extrabold text-foreground text-center">
                      {title}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <CodeBlock code={`import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/pico-ui/carousel"

<Carousel className="w-full max-w-xs">
  <CarouselContent>
    {recordings.map((title, index) => (
      <CarouselItem key={index}>
        <div className="flex aspect-video flex-col items-center justify-center border border-foreground rounded-sm bg-card shadow-sm p-6">
          {title}
        </div>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`} />
      </Section>
    </div>
  );
}
