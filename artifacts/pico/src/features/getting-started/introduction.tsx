
export default function Introduction() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="inline-block px-4 py-2 bg-accent border border-foreground shadow-sm rounded-sm font-bold tracking-widest uppercase text-sm text-accent-foreground">
          GETTING STARTED
        </div>
 <h1 className="text-6xl md:text-7xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Say hello <br /> to Pico.
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl font-medium leading-relaxed text-foreground/90 pt-4">
          A bold, playful, and high-contrast design system. Confident, chunky, and full of personality. Like a snack brand that actually tastes good.
        </p>
      </div>

      <div className="border-2 border-foreground rounded-sm overflow-hidden shadow-md bg-accent relative p-12 md:p-24 flex items-center justify-center min-h-[400px]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10 text-center space-y-8 max-w-xl mx-auto">
 <div className="text-4xl md:text-6xl font-display font-extrabold text-accent-foreground leading-none">
            Loud & Clear
          </div>
          <p className="text-xl font-bold text-accent-foreground/80">
            We don't do subtle. We do high contrast, heavy shadows, and typography that demands attention.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="border-2 border-foreground p-6 rounded-sm bg-background shadow-md">
 <h3 className="text-2xl font-display font-extrabold mb-2">Bold</h3>
          <p className="font-medium text-foreground/80">
            Heavy typefaces, thick borders, and unmissable colors. Everything is designed to stand out.
          </p>
        </div>
        <div className="border-2 border-foreground p-6 rounded-sm bg-background shadow-md">
 <h3 className="text-2xl font-display font-extrabold mb-2">Playful</h3>
          <p className="font-medium text-foreground/80">
            Offset shadows, slightly goofy radius values, and a layout that doesn't take itself too seriously.
          </p>
        </div>
        <div className="border-2 border-foreground p-6 rounded-sm bg-background shadow-md">
 <h3 className="text-2xl font-display font-extrabold mb-2">Accessible</h3>
          <p className="font-medium text-foreground/80">
            High contrast isn't just an aesthetic—it makes the UI inherently readable and navigable for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
