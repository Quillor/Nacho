import { motion } from "framer-motion";

export default function Spacing() {
  const spaces = [
    { token: 'space-1', size: '4px', rem: '0.25rem', width: 'w-1', desc: 'Inner component tweaks' },
    { token: 'space-2', size: '8px', rem: '0.5rem', width: 'w-2', desc: 'Tight component gaps' },
    { token: 'space-4', size: '16px', rem: '1rem', width: 'w-4', desc: 'Standard item gap' },
    { token: 'space-8', size: '32px', rem: '2rem', width: 'w-8', desc: 'Inner card padding' },
    { token: 'space-12', size: '48px', rem: '3rem', width: 'w-12', desc: 'Section sub-breaks' },
    { token: 'space-24', size: '96px', rem: '6rem', width: 'w-24', desc: 'Major section breaks' },
  ];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Spacing
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          We use a strict 8px baseline grid (with occasional 4px half-steps). Everything should snap to it. Bigger jumps in spacing equal bigger structural importance.
        </p>
      </div>

      <div className="space-y-6">
        {spaces.map((space, i) => (
          <div key={i} className="flex items-center gap-6 group">
            <div className="w-32 shrink-0">
              <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit mb-1">{space.token}</div>
              <div className="text-xs font-bold text-foreground/60">{space.size} / {space.rem}</div>
            </div>
            <div className="flex-1 max-w-md h-12 bg-primary/10 border-2 border-foreground/20 rounded-sm flex items-center px-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`h-10 bg-primary border-2 border-foreground ${space.width}`} 
              />
            </div>
            <div className="text-sm font-medium hidden md:block text-foreground/80">{space.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
