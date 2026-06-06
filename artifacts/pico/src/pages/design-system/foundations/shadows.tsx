export default function Shadows() {
  const shadows = [
    { token: 'shadow-2xs', class: 'shadow-2xs', desc: '1px solid offset. Used for tiny badges or subtle borders.' },
    { token: 'shadow-xs', class: 'shadow-xs', desc: '2px solid offset. Used for small buttons and inputs.' },
    { token: 'shadow-sm', class: 'shadow-sm', desc: '4px solid offset. Used for standard buttons and small cards.' },
    { token: 'shadow-md', class: 'shadow-md', desc: '8px solid offset. Used for standard cards and prominent interactive elements.' },
    { token: 'shadow-lg', class: 'shadow-lg', desc: '12px solid offset. Used for modals and floating popovers.' },
    { token: 'shadow-xl', class: 'shadow-xl', desc: '16px solid offset. Used for massive hero cards or major emphasis.' },
  ];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Shadows
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Forget soft, blurry drop shadows. Pico uses solid, chunky offset shadows to create depth. It's brutalist, graphic, and highly tactile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        {shadows.map((shadow, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit">
              {shadow.token}
            </div>
            <div className={`h-40 bg-accent border-4 border-foreground rounded-sm ${shadow.class} flex items-center justify-center`}>
 <span className="font-display font-extrabold text-2xl text-accent-foreground">Hover Me</span>
            </div>
            <p className="text-sm font-medium text-foreground/80">{shadow.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
