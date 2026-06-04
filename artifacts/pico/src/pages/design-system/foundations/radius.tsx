export default function Radius() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Radius
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Pico uses very tight border radii. We prefer sharp, boxy shapes with just a tiny bit of rounding to take the edge off. Too round feels soft; too sharp feels aggressive. Pico is right in the middle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">
            rounded-sm
          </div>
          <div className="h-32 bg-primary border-4 border-foreground rounded-sm shadow-md flex items-center justify-center">
            <span className="font-bold">2px</span>
          </div>
          <p className="text-sm font-medium text-foreground/80">Standard rounding for almost all components: cards, buttons, inputs.</p>
        </div>

        <div className="space-y-4">
          <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">
            rounded-md
          </div>
          <div className="h-32 bg-primary border-4 border-foreground rounded-md shadow-md flex items-center justify-center">
            <span className="font-bold">4px</span>
          </div>
          <p className="text-sm font-medium text-foreground/80">Slightly larger rounding for larger container elements.</p>
        </div>

        <div className="space-y-4">
          <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">
            rounded-full
          </div>
          <div className="h-32 bg-primary border-4 border-foreground rounded-full shadow-md flex items-center justify-center">
            <span className="font-bold">9999px</span>
          </div>
          <p className="text-sm font-medium text-foreground/80">Used exclusively for avatars, icon buttons, or specific circular badges.</p>
        </div>
      </div>
    </div>
  );
}
