import { Badge } from "@workspace/pico-ui/badge";
import { Button } from "@workspace/pico-ui/button";

export default function Colors() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Colors
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The Pico palette is tight, high-contrast, and unapologetic. 
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase">Core Palette</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Primary */}
          <div className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300">
            <div className="h-48 bg-primary w-full border-b-4 border-foreground p-4 flex items-end">
              <span className="font-display text-4xl font-black text-foreground">Aa</span>
            </div>
            <div className="p-6 bg-background">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold uppercase">Golden Yellow</h3>
                <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#F5C518</span>
              </div>
              <p className="text-foreground/70 font-medium text-sm mt-2"><code className="font-mono bg-foreground/10 px-1">bg-primary</code></p>
              <p className="text-foreground/70 font-medium mt-2">Primary brand color. Loud, attention-grabbing, used for major highlights and hero sections.</p>
            </div>
          </div>

          {/* Dark */}
          <div className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300">
            <div className="h-48 bg-foreground w-full border-b-4 border-foreground p-4 flex items-end">
              <span className="font-display text-4xl font-black text-background">Aa</span>
            </div>
            <div className="p-6 bg-background">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold uppercase">Deep Brown</h3>
                <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#2E1C0F</span>
              </div>
              <p className="text-foreground/70 font-medium text-sm mt-2"><code className="font-mono bg-foreground/10 px-1">bg-foreground</code></p>
              <p className="text-foreground/70 font-medium mt-2">The ink. Used for all text, thick borders, heavy shadows, and providing ground.</p>
            </div>
          </div>

          {/* Light */}
          <div className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300">
            <div className="h-48 bg-background w-full border-b-4 border-foreground p-4 flex items-end relative overflow-hidden">
              <span className="font-display text-4xl font-black text-foreground relative z-10">Aa</span>
            </div>
            <div className="p-6 bg-background">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold uppercase">Cream</h3>
                <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#F8F4E6</span>
              </div>
              <p className="text-foreground/70 font-medium text-sm mt-2"><code className="font-mono bg-foreground/10 px-1">bg-background</code></p>
              <p className="text-foreground/70 font-medium mt-2">The canvas. Soft, warm, and highly readable as the primary background color.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-3xl font-display font-black uppercase">Approved Combinations</h2>
        
        <div className="space-y-12">
          {/* Combo A */}
          <div className="grid md:grid-cols-[1fr_2fr] border-4 border-foreground rounded-sm overflow-hidden shadow-md">
            <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
              <h3 className="text-2xl font-bold uppercase mb-2">Combo A</h3>
              <p className="opacity-80 mb-4">Yellow on Brown. Extremely high contrast, excellent for banners and emphasis.</p>
              <Badge variant="outline" className="w-fit border-background text-background">Accessible AAA</Badge>
            </div>
            <div className="bg-primary text-foreground p-8 md:p-12 flex flex-col justify-center">
              <h4 className="text-3xl md:text-4xl uppercase mb-4 font-display font-black">Loud & Clear</h4>
              <p className="text-lg font-medium mb-8 max-w-md">This combination is our bread and butter. It's impossible to ignore and perfectly captures the snack-brand energy.</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 border-2 border-transparent shadow-[4px_4px_0px_0px_hsl(var(--background)/0.3)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--background)/0.3)] transition-all font-bold">
                  Solid Action
                </Button>
                <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-primary shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
                  Outline Action
                </Button>
              </div>
            </div>
          </div>

          {/* Combo B */}
          <div className="grid md:grid-cols-[1fr_2fr] border-4 border-foreground rounded-sm overflow-hidden shadow-md">
            <div className="bg-primary text-foreground p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
              <h3 className="text-2xl font-bold uppercase mb-2">Combo B</h3>
              <p className="opacity-80 mb-4">Cream/Yellow on Brown. Deep, rich, and grounds the layout.</p>
              <Badge variant="outline" className="w-fit border-foreground text-foreground">Accessible AAA</Badge>
            </div>
            <div className="bg-foreground text-background p-8 md:p-12 flex flex-col justify-center">
              <h4 className="text-3xl md:text-4xl uppercase mb-4 text-primary font-display font-black">The Midnight Snack</h4>
              <p className="text-lg font-medium mb-8 max-w-md text-background/90">Use this for footers, dramatic section breaks, or when you need the reader to stop scrolling and pay attention.</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary text-foreground hover:bg-primary/90 border-2 border-transparent shadow-[4px_4px_0px_0px_hsl(var(--background)/0.2)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--background)/0.2)] transition-all font-bold">
                  Solid Action
                </Button>
                <Button size="lg" variant="outline" className="border-background text-background hover:bg-background hover:text-foreground shadow-[4px_4px_0px_0px_hsl(var(--background))] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--background))] transition-all font-bold">
                  Outline Action
                </Button>
              </div>
            </div>
          </div>

          {/* Combo C */}
           <div className="grid md:grid-cols-[1fr_2fr] border-4 border-foreground rounded-sm overflow-hidden shadow-md">
            <div className="bg-background text-foreground p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
              <h3 className="text-2xl font-bold uppercase mb-2">Combo C</h3>
              <p className="opacity-80 mb-4">Brown on Cream. The standard reading experience, warm and legible.</p>
              <Badge variant="outline" className="w-fit border-foreground text-foreground">Accessible AAA</Badge>
            </div>
            <div className="bg-background text-foreground p-8 md:p-12 flex flex-col justify-center">
              <h4 className="text-3xl md:text-4xl uppercase mb-4 font-display font-black">Daily Bread</h4>
              <p className="text-lg font-medium mb-8 max-w-md">This is where the actual reading happens. It's softer than pure white on black, making it friendlier on the eyes.</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
                  Solid Action
                </Button>
                <Button size="lg" variant="outline" className="border-foreground text-foreground bg-transparent hover:bg-primary shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all font-bold">
                  Outline Action
                </Button>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
