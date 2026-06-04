export default function Typography() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground">
          Typography
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          The contrast between the tight, heavy display face and the highly legible, slightly open body font is what gives Pico its distinct personality.
        </p>
      </div>

      <div className="space-y-12">
        <div className="border-b-4 border-foreground/20 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <span className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">Display 1 / 8rem / 900 / 0.9</span>
 <span className="text-foreground/70 font-bold">Platypi</span>
          </div>
 <div className="text-[5rem] md:text-[8rem] font-display font-black leading-[0.9] tracking-tight">Giant.</div>
        </div>

        <div className="border-b-4 border-foreground/20 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <span className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">Heading 1 / 4.5rem / 800 / 1.0</span>
 <span className="text-foreground/70 font-bold">Platypi</span>
          </div>
 <div className="text-5xl md:text-7xl font-display font-extrabold leading-[1] tracking-tight">Punchy Title.</div>
        </div>

        <div className="border-b-4 border-foreground/20 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <span className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">Heading 3 / 2.25rem / 800 / 1.1</span>
 <span className="text-foreground/70 font-bold">Platypi</span>
          </div>
 <div className="text-3xl md:text-4xl font-display font-extrabold leading-[1.1]">Section Header.</div>
        </div>

        <div className="border-b-4 border-foreground/20 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <span className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">Body Large / 1.25rem / 500 / 1.6</span>
 <span className="text-foreground/70 font-bold">DM Sans</span>
          </div>
          <div className="text-xl font-medium leading-relaxed max-w-3xl">Pico relies on large, legible body copy for readable experiences. We use DM Sans for its clean geometry and slight quirkiness that complements the display face.</div>
        </div>

         <div className="pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <span className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">Caption / 0.875rem / 700 / 1.5</span>
 <span className="text-foreground/70 font-bold">DM Sans</span>
          </div>
          <div className="text-sm font-bold uppercase tracking-wider max-w-3xl">Used for tiny labels, metadata, and making sure small text still packs a punch.</div>
        </div>
      </div>
    </div>
  );
}
