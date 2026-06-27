import { Section } from "@/components/docs/shared";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@workspace/pico-ui/navigation-menu";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function NavigationMenuDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Navigation Menu
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The primary top-level nav for Nacho. Mix flat links with triggers that drop a bordered panel of related destinations — keep labels short and loud.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="font-bold">Recordings</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-64 gap-1 p-2 bg-popover">
                    <li>
                      <NavigationMenuLink className="block rounded-sm p-3 hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-bold">All recordings</div>
                        <p className="text-xs text-muted-foreground">Browse your full library</p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="block rounded-sm p-3 hover:bg-accent hover:text-accent-foreground">
                        <div className="text-sm font-bold">Chapters</div>
                        <p className="text-xs text-muted-foreground">Jump to key moments</p>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle() + " font-bold"}>
                  Transcript
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <CodeBlock code={`import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@workspace/pico-ui/navigation-menu"

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger className="font-bold">Recordings</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-64 gap-1 p-2 bg-popover">
          <li>
            <NavigationMenuLink className="block rounded-sm p-3 hover:bg-accent hover:text-accent-foreground">
              <div className="text-sm font-bold">All recordings</div>
              <p className="text-xs text-muted-foreground">Browse your full library</p>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink className="block rounded-sm p-3 hover:bg-accent hover:text-accent-foreground">
              <div className="text-sm font-bold">Chapters</div>
              <p className="text-xs text-muted-foreground">Jump to key moments</p>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink className={navigationMenuTriggerStyle() + " font-bold"}>
        Transcript
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`} />
      </Section>
    </div>
  );
}
