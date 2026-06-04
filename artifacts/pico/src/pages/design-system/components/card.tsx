import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@workspace/pico-ui/card";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function CardDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Card
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Displays a card with header, content, and footer. The Pico card is thick, bordered, and casts a heavy shadow.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-black border-b-4 border-foreground pb-2">Basic Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50">
          <Card className="max-w-[350px]">
            <CardHeader>
              <CardTitle>Snack Box Subscription</CardTitle>
              <CardDescription>Get a box of artisanal snacks delivered to your door every month.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Includes a mix of sweet and savory items hand-picked by our team.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Subscribe Now</Button>
            </CardFooter>
          </Card>
        </div>
        <CodeBlock code={`import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/pico-ui/card"

<Card className="max-w-[350px]">
  <CardHeader>
    <CardTitle>Snack Box Subscription</CardTitle>
    <CardDescription>Get a box of artisanal snacks delivered to your door every month.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Includes a mix of sweet and savory items hand-picked by our team.</p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Subscribe Now</Button>
  </CardFooter>
</Card>`} />
      </section>
    </div>
  );
}
