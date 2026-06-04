import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@workspace/pico-ui/item";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Video, MoreHorizontal } from "lucide-react";

export default function ItemDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Item
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A flexible row for lists — media on the left, a title and description in the middle, actions on the right. Stack several inside an <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">ItemGroup</code> to build a tidy library of recordings.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <Item
            variant="outline"
            className="w-full max-w-md border-2 border-foreground"
          >
            <ItemMedia variant="icon">
              <Video />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Q3 product walkthrough</ItemTitle>
              <ItemDescription>4:12 · Recorded yesterday</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
              </Button>
            </ItemActions>
          </Item>
        </div>
        <CodeBlock code={`import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/pico-ui/item"
import { Button } from "@workspace/pico-ui/button"
import { Video, MoreHorizontal } from "lucide-react"

<Item variant="outline">
  <ItemMedia variant="icon">
    <Video />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>Q3 product walkthrough</ItemTitle>
    <ItemDescription>4:12 · Recorded yesterday</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="outline" size="icon">
      <MoreHorizontal />
    </Button>
  </ItemActions>
</Item>`} />
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase border-b-4 border-foreground pb-2">Grouped</h2>
        <p className="text-base font-medium leading-relaxed text-foreground/80 max-w-2xl">
          Wrap rows in an <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">ItemGroup</code> and divide them with <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">ItemSeparator</code> for a clean list of recordings.
        </p>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <ItemGroup className="w-full max-w-md border-2 border-foreground rounded-md bg-background">
            <Item>
              <ItemMedia variant="icon">
                <Video />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Onboarding walkthrough</ItemTitle>
                <ItemDescription>2:48 · Shared</ItemDescription>
              </ItemContent>
            </Item>
            <ItemSeparator />
            <Item>
              <ItemMedia variant="icon">
                <Video />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Bug repro for #482</ItemTitle>
                <ItemDescription>0:54 · Private</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
        <CodeBlock code={`import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@workspace/pico-ui/item"

<ItemGroup>
  <Item>
    <ItemMedia variant="icon">
      <Video />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>Onboarding walkthrough</ItemTitle>
      <ItemDescription>2:48 · Shared</ItemDescription>
    </ItemContent>
  </Item>
  <ItemSeparator />
  <Item>
    <ItemMedia variant="icon">
      <Video />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>Bug repro for #482</ItemTitle>
      <ItemDescription>0:54 · Private</ItemDescription>
    </ItemContent>
  </Item>
</ItemGroup>`} />
      </section>
    </div>
  );
}
