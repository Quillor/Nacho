import { Section } from "@/components/docs/shared";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@workspace/pico-ui/breadcrumb";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function BreadcrumbDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Breadcrumb
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Shows where a recording lives and lets people jump back up the hierarchy in one click.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Breadcrumb className="bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Tutorials</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Onboarding walkthrough</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <CodeBlock code={`import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/pico-ui/breadcrumb"

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Library</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="#">Tutorials</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Onboarding walkthrough</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`} />
      </Section>

      <Section title="Collapsed">
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Deep trails get long. Use an ellipsis to fold the middle and keep the first and last crumbs.
        </p>
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <Breadcrumb className="bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Standup recap</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <CodeBlock code={`import { BreadcrumbEllipsis } from "@workspace/pico-ui/breadcrumb"

<BreadcrumbItem>
  <BreadcrumbEllipsis />
</BreadcrumbItem>`} />
      </Section>
    </div>
  );
}
