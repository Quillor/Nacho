import { motion } from "framer-motion";
import { Button } from "@workspace/pico-ui/button";
import { Card, CardContent } from "@workspace/pico-ui/card";
import { Badge } from "@workspace/pico-ui/badge";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { Alert, AlertDescription, AlertTitle } from "@workspace/pico-ui/alert";
import { InfoIcon, ArrowRight, PaintBucket, Type, Frame, LayoutGrid } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
      
      {/* 1. Intro / Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 border-b-4 border-foreground overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <motion.div 
          className="max-w-5xl mx-auto relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeIn} className="inline-block mb-6 px-4 py-2 bg-background border-2 border-foreground shadow-sm rounded-sm font-bold tracking-widest uppercase text-sm">
            DESIGN SYSTEM v1.0
          </motion.div>
 <motion.h1 variants={fadeIn} className="text-7xl md:text-9xl tracking-tight leading-[0.9] mb-8 text-foreground">
            Say hello <br/> to Pico.
          </motion.h1>
          <motion.p variants={fadeIn} className="text-xl md:text-2xl max-w-2xl font-medium leading-relaxed text-foreground/90">
            A bold, playful, and high-contrast design system. Confident, chunky, and full of personality. Like a snack brand that actually tastes good.
          </motion.p>
        </motion.div>
      </section>

      {/* 2. Color Palette */}
      <section className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="mb-16 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary border-2 border-foreground rounded-sm shadow-sm flex items-center justify-center">
              <PaintBucket className="w-6 h-6 text-foreground" />
            </div>
 <h2 className="text-4xl md:text-5xl">Core Palette</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Primary */}
            <motion.div 
              className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="h-48 bg-primary w-full border-b-4 border-foreground p-4 flex items-end">
                <span className="font-display text-4xl font-black text-foreground">Aa</span>
              </div>
              <div className="p-6 bg-background">
                <div className="flex justify-between items-start mb-2">
 <h3 className="text-2xl font-bold">Golden Yellow</h3>
                  <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#F5C518</span>
                </div>
                <p className="text-foreground/70 font-medium">Primary brand color. Loud, attention-grabbing, used for major highlights and hero sections.</p>
              </div>
            </motion.div>

            {/* Dark */}
            <motion.div 
              className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="h-48 bg-foreground w-full border-b-4 border-foreground p-4 flex items-end">
                <span className="font-display text-4xl font-black text-background">Aa</span>
              </div>
              <div className="p-6 bg-background">
                <div className="flex justify-between items-start mb-2">
 <h3 className="text-2xl font-bold">Deep Brown</h3>
                  <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#2E1C0F</span>
                </div>
                <p className="text-foreground/70 font-medium">The ink. Used for all text, thick borders, heavy shadows, and providing ground.</p>
              </div>
            </motion.div>

            {/* Light */}
            <motion.div 
              className="group border-4 border-foreground rounded-sm overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="h-48 bg-background w-full border-b-4 border-foreground p-4 flex items-end relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                <span className="font-display text-4xl font-black text-foreground relative z-10">Aa</span>
              </div>
              <div className="p-6 bg-background">
                <div className="flex justify-between items-start mb-2">
 <h3 className="text-2xl font-bold">Cream</h3>
                  <span className="font-mono bg-foreground text-background px-2 py-1 rounded-sm text-sm">#F8F4E6</span>
                </div>
                <p className="text-foreground/70 font-medium">The canvas. Soft, warm, and highly readable as the primary background color.</p>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-2 border-foreground p-4 rounded-sm flex items-center justify-between bg-[#5E4230]">
              <span className="text-background font-bold">Soft Brown</span>
              <span className="font-mono text-background/80 text-xs">#5E4230</span>
            </div>
            <div className="border-2 border-foreground p-4 rounded-sm flex items-center justify-between bg-[#FFFDF5]">
              <span className="text-foreground font-bold">Off White</span>
              <span className="font-mono text-foreground/80 text-xs">#FFFDF5</span>
            </div>
            <div className="border-2 border-foreground p-4 rounded-sm flex items-center justify-between bg-[#1A1008]">
              <span className="text-background font-bold">Near Black</span>
              <span className="font-mono text-background/80 text-xs">#1A1008</span>
            </div>
            <div className="border-2 border-foreground p-4 rounded-sm flex items-center justify-between bg-[#FCE883]">
              <span className="text-foreground font-bold">Pale Yellow</span>
              <span className="font-mono text-foreground/80 text-xs">#FCE883</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Color Combinations */}
      <section className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-background">
        <div className="max-w-5xl mx-auto">
           <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary border-2 border-foreground rounded-sm shadow-sm flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-foreground" />
            </div>
 <h2 className="text-4xl md:text-5xl">Combinations</h2>
          </motion.div>

          <div className="space-y-12">
            {/* Combo A */}
            <div className="grid md:grid-cols-[1fr_2fr] border-4 border-foreground rounded-sm overflow-hidden shadow-md">
              <div className="bg-foreground text-background p-8 border-b-4 md:border-b-0 md:border-r-4 border-foreground flex flex-col justify-center">
 <h3 className="text-2xl font-bold mb-2">Combo A</h3>
                <p className="opacity-80 mb-4">Yellow on Brown. Extremely high contrast, excellent for banners and emphasis.</p>
                <Badge variant="outline" className="w-fit border-background text-background">Accessible AAA</Badge>
              </div>
              <div className="bg-primary text-foreground p-8 md:p-12 flex flex-col justify-center">
 <h4 className="text-3xl md:text-4xl mb-4">Loud & Clear</h4>
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
 <h3 className="text-2xl font-bold mb-2">Combo B</h3>
                <p className="opacity-80 mb-4">Cream/Yellow on Brown. Deep, rich, and grounds the layout.</p>
                <Badge variant="outline" className="w-fit border-foreground text-foreground">Accessible AAA</Badge>
              </div>
              <div className="bg-foreground text-background p-8 md:p-12 flex flex-col justify-center">
 <h4 className="text-3xl md:text-4xl mb-4 text-primary">The Midnight Snack</h4>
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
 <h3 className="text-2xl font-bold mb-2">Combo C</h3>
                <p className="opacity-80 mb-4">Brown on Cream. The standard reading experience, warm and legible.</p>
                <Badge variant="outline" className="w-fit border-foreground text-foreground">Accessible AAA</Badge>
              </div>
              <div className="bg-background text-foreground p-8 md:p-12 flex flex-col justify-center">
 <h4 className="text-3xl md:text-4xl mb-4">Daily Bread</h4>
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
        </div>
      </section>

      {/* 4. Typography */}
      <section className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-background border-2 border-foreground rounded-sm shadow-sm flex items-center justify-center">
              <Type className="w-6 h-6 text-foreground" />
            </div>
 <h2 className="text-4xl md:text-5xl">Typography</h2>
          </motion.div>

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
              <div className="text-xl font-medium leading-relaxed max-w-3xl">The contrast between the tight, heavy display face and the highly legible, slightly open body font is what gives Pico its distinct personality.</div>
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
      </section>

      {/* 5. Spacing */}
      <section className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary border-2 border-foreground rounded-sm shadow-sm flex items-center justify-center">
              <Frame className="w-6 h-6 text-foreground" />
            </div>
 <h2 className="text-4xl md:text-5xl">Spacing</h2>
          </motion.div>

          <p className="text-xl font-medium mb-12 max-w-2xl">We use a strict 8px baseline grid. Everything should snap to it. Bigger jumps in spacing equal bigger structural importance.</p>

          <div className="space-y-6">
            {[
              { token: 'space-2', size: '8px', rem: '0.5rem', width: 'w-2', desc: 'Tight component gaps' },
              { token: 'space-4', size: '16px', rem: '1rem', width: 'w-4', desc: 'Standard item gap' },
              { token: 'space-8', size: '32px', rem: '2rem', width: 'w-8', desc: 'Inner card padding' },
              { token: 'space-12', size: '48px', rem: '3rem', width: 'w-12', desc: 'Section sub-breaks' },
              { token: 'space-24', size: '96px', rem: '6rem', width: 'w-24', desc: 'Major section breaks' },
            ].map((space, i) => (
              <div key={i} className="flex items-center gap-6 group">
                <div className="w-32 shrink-0">
                  <div className="font-mono font-bold text-sm bg-foreground text-background px-2 py-1 rounded-sm w-fit mb-1">{space.token}</div>
                  <div className="text-xs font-bold text-foreground/60">{space.size} / {space.rem}</div>
                </div>
                <div className="flex-1 max-w-md h-12 bg-background border-2 border-foreground/20 rounded-sm flex items-center px-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: 'auto' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`h-10 bg-primary border-2 border-foreground ${space.width}`} 
                  />
                </div>
                <div className="text-sm font-medium hidden md:block text-foreground/80">{space.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Components */}
      <section className="py-24 px-6 md:px-12 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-16 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary border-2 border-foreground rounded-sm shadow-sm flex items-center justify-center">
              <PaintBucket className="w-6 h-6 text-foreground" />
            </div>
 <h2 className="text-4xl md:text-5xl">Components</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Buttons & Badges */}
            <div className="space-y-12">
              <div>
 <h3 className="text-2xl font-bold mb-6 border-b-4 border-foreground/10 pb-2">Buttons</h3>
                <div className="flex flex-wrap gap-6 items-center">
                  <Button size="lg" className="font-bold border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all bg-primary text-foreground hover:bg-primary/90">
                    Primary Action
                  </Button>
                  <Button size="lg" className="font-bold border-2 border-foreground shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all bg-background text-foreground hover:bg-primary/80">
                    Secondary Outline
                  </Button>
                  <Button size="icon" className="font-bold border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all bg-foreground text-background hover:bg-foreground/90 rounded-full w-12 h-12">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div>
 <h3 className="text-2xl font-bold mb-6 border-b-4 border-foreground/10 pb-2">Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge className="text-sm font-bold uppercase tracking-wider px-3 py-1 bg-primary text-foreground border-2 border-foreground rounded-sm shadow-xs">New Feature</Badge>
                  <Badge className="text-sm font-bold uppercase tracking-wider px-3 py-1 bg-foreground text-background border-2 border-foreground rounded-sm shadow-xs">Sold Out</Badge>
                  <Badge className="text-sm font-bold uppercase tracking-wider px-3 py-1 bg-background text-foreground border-2 border-foreground rounded-sm shadow-xs">Limited Edition</Badge>
                </div>
              </div>
            </div>

            {/* Forms & Inputs */}
            <div>
 <h3 className="text-2xl font-bold mb-6 border-b-4 border-foreground/10 pb-2">Forms</h3>
              <Card className="border-4 border-foreground shadow-md rounded-sm bg-background">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold uppercase text-sm">Email Address</Label>
                    <Input 
                      id="email" 
                      placeholder="hello@snack.com" 
                      className="border-2 border-foreground shadow-[inset_2px_2px_0px_0px_hsl(var(--foreground)/0.1)] focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-foreground bg-background text-lg py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promo" className="font-bold uppercase text-sm">Promo Code</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="promo" 
                        defaultValue="CRUNCHY20" 
                        className="border-2 border-foreground shadow-[inset_2px_2px_0px_0px_hsl(var(--foreground)/0.1)] focus-visible:ring-primary focus-visible:ring-offset-0 bg-background text-lg py-6 font-mono font-bold"
                      />
                      <Button size="lg" className="h-auto font-bold border-2 border-transparent shadow-sm hover:translate-y-[2px] hover:shadow-xs bg-foreground text-background transition-all">
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            <div className="md:col-span-2 mt-8">
 <h3 className="text-2xl font-bold mb-6 border-b-4 border-foreground/10 pb-2">Alerts</h3>
              <Alert className="border-4 border-foreground shadow-md bg-primary text-foreground rounded-sm flex items-start gap-4 p-6">
                <InfoIcon className="h-6 w-6 mt-1 flex-shrink-0" />
                <div>
 <AlertTitle className="text-xl font-bold mb-2">Attention Shoppers!</AlertTitle>
                  <AlertDescription className="font-medium text-lg">
                    This is an important message formatted in the true Pico style. Notice how the thick borders and solid colors make it impossible to ignore.
                  </AlertDescription>
                </div>
              </Alert>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-6 md:px-12 border-t-8 border-primary">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-display font-black text-4xl uppercase tracking-widest text-primary">Pico.</div>
          <p className="font-bold uppercase tracking-wider text-sm opacity-80">© {new Date().getFullYear()} Pico Design System</p>
        </div>
      </footer>

    </div>
  );
}
