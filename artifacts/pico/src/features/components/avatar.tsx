import { Section } from "@/components/docs/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/pico-ui/avatar";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function AvatarDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Avatar
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          An image element with a fallback for representing the user.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          
          <Avatar>
            <AvatarFallback className="bg-accent text-accent-foreground font-bold">PI</AvatarFallback>
          </Avatar>
        </div>
        <CodeBlock code={`import { Avatar, AvatarFallback, AvatarImage } from "@workspace/pico-ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`} />
      </Section>
    </div>
  );
}
