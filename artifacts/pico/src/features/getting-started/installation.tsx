import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function Installation() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Installation & Usage
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          How to consume the Pico design system tokens and components in your own projects.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
 <h2 className="text-3xl font-display font-extrabold">Tailwind Configuration</h2>
          <p className="font-medium text-foreground/80">
            Pico uses standard Tailwind CSS classes mapped to our custom design tokens. Here's a quick cheat sheet:
          </p>
          
          <div className="border-2 border-foreground rounded-sm overflow-hidden bg-background">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground text-background uppercase font-bold text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b-2 border-foreground">Tailwind Class</th>
                  <th className="p-4 border-b-2 border-foreground">CSS Variable</th>
                  <th className="p-4 border-b-2 border-foreground">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-foreground font-mono">
                <tr>
                  <td className="p-4 bg-accent/10">bg-accent</td>
                  <td className="p-4">--primary</td>
                  <td className="p-4 font-sans font-medium">Major highlights, primary buttons</td>
                </tr>
                <tr>
                  <td className="p-4">bg-background</td>
                  <td className="p-4">--background</td>
                  <td className="p-4 font-sans font-medium">Main app canvas (warm background)</td>
                </tr>
                <tr>
                  <td className="p-4 bg-foreground/10">text-foreground</td>
                  <td className="p-4">--foreground</td>
                  <td className="p-4 font-sans font-medium">Main text color (Deep Brown)</td>
                </tr>
                <tr>
                  <td className="p-4">shadow-md</td>
                  <td className="p-4">--shadow-md</td>
                  <td className="p-4 font-sans font-medium">Standard chunky component shadow</td>
                </tr>
                <tr>
                  <td className="p-4">font-display</td>
                  <td className="p-4">--font-display</td>
                  <td className="p-4 font-sans font-medium">Platypi for headings</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
 <h2 className="text-3xl font-display font-extrabold">Using Components</h2>
          <p className="font-medium text-foreground/80">
            Our components are built on top of shadcn/ui but heavily styled with the Pico theme. Import them from <code className="bg-foreground/10 px-1 rounded-sm">@/components/ui</code>.
          </p>
          
          <CodeBlock code={`import { Button } from "@workspace/pico-ui/button";
import { Card, CardContent } from "@workspace/pico-ui/card";

export default function MyView() {
  return (
    <Card className="max-w-md">
      <CardContent className="p-6 space-y-4">
 <h3 className="text-2xl font-display font-extrabold">Snack Time</h3>
        <p>Ready for a break?</p>
        <Button size="lg">Grab a bite</Button>
      </CardContent>
    </Card>
  );
}`} />
        </section>

        <section className="space-y-4">
 <h2 className="text-3xl font-display font-extrabold">The Root Layout</h2>
          <p className="font-medium text-foreground/80">
            Make sure your root HTML or body tag has the correct base classes to set the stage:
          </p>
          
          <CodeBlock code={`<body className="min-h-[100dvh] bg-background text-foreground selection:bg-accent selection:text-accent-foreground antialiased font-sans">
  <div id="root"></div>
</body>`} />
        </section>
      </div>
    </div>
  );
}
