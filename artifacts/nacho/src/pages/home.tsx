import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@workspace/pico-ui/button";
import { Card, CardContent } from "@workspace/pico-ui/card";
import { Badge } from "@workspace/pico-ui/badge";
import { Video, Share2, Scissors, Zap, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import videoPlayerNacho from "@workspace/nacho-illustrations/assets/nacho-dip-sales-player.png";
import hammockNacho from "@workspace/nacho-illustrations/assets/nacho-hammock.png";
import emptyBowlNacho from "@workspace/nacho-illustrations/assets/sad-nacho-empty-bowl.png";

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
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b-4 border-foreground bg-background py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Nacho home">
          <Logo className="h-9" />
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" className="hidden md:flex font-bold border-2 border-transparent text-foreground hover:bg-muted transition-all">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="relative pt-40 pb-24 px-6 md:px-12 border-b-4 border-foreground overflow-hidden bg-primary">
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div variants={fadeIn} className="inline-block mb-6 px-4 py-2 bg-background border-2 border-foreground shadow-sm rounded-sm font-bold tracking-widest uppercase text-sm text-foreground">
              Stop typing. Start talking.
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl font-display font-black tracking-tight leading-[0.9] mb-8 text-foreground uppercase">
              Send a <br/> video, not <br/> a novel.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/90 mb-10 max-w-lg">
              Record your screen, camera, and mic. Share an instant link. Nacho is the fastest way to get your point across without typing a 10-paragraph email.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-16 px-8 text-lg font-bold border-4 border-foreground shadow-lg hover:translate-y-[2px] hover:shadow-md transition-all bg-background text-foreground hover:bg-background/90 rounded-none">
                <Link href="/sign-up">Start Recording Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-16 px-8 text-lg font-bold border-4 border-foreground shadow-lg hover:translate-y-[2px] hover:shadow-md transition-all bg-transparent text-foreground hover:bg-foreground hover:text-background rounded-none">
                <Link href="/sign-in">My Library</Link>
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="border-4 border-foreground shadow-xl bg-background rounded-xl overflow-hidden aspect-video relative flex items-center justify-center p-6">
              <img src={videoPlayerNacho} alt="Nacho mascot presenting in a video player" className="w-full h-full object-contain" />
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-6 -left-6 bg-secondary text-secondary-foreground font-display font-black uppercase text-2xl py-3 px-6 border-4 border-foreground shadow-lg -rotate-6">
              Instant Link!
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Value Prop (Scrolling Text) */}
      <section className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-foreground text-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 md:order-1"
          >
            <img src={emptyBowlNacho} alt="A sad nacho mascot leaning on an empty bowl" className="w-full max-w-md mx-auto object-contain drop-shadow-[6px_6px_0px_hsl(var(--primary)/0.25)]" />
          </motion.div>
          <div className="order-1 md:order-2 text-center md:text-left">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-display font-black uppercase leading-tight mb-8"
            >
              You speak 7x faster than you type. <br/>
              <span className="text-primary">Why are you still typing?</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl font-medium text-background/80"
            >
              Emails get misread. Meetings take too long. A quick Nacho video captures your tone, your screen, and your exact point in seconds.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary border-4 border-foreground rounded-none shadow-sm flex items-center justify-center">
              <Zap className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-5xl md:text-6xl font-display font-black uppercase text-foreground">Power Moves</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-4 border-foreground rounded-xl overflow-hidden shadow-xl hover:-translate-y-2 transition-transform duration-300 bg-card group flex flex-col"
            >
              <div className="aspect-[16/9] bg-primary w-full border-b-4 border-foreground relative overflow-hidden flex items-center justify-center">
                <Video className="w-24 h-24 text-foreground transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-display font-bold uppercase mb-4 text-card-foreground">Record Anything</h3>
                  <p className="text-card-foreground/80 font-medium text-lg mb-6">Capture your screen, your face, or both. Nacho lives in your menu bar, ready to roll.</p>
                </div>
                <Badge className="w-fit text-sm font-bold uppercase tracking-wider px-3 py-1 bg-primary text-primary-foreground border-2 border-foreground rounded-none shadow-sm">1-Click Record</Badge>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border-4 border-foreground rounded-xl overflow-hidden shadow-xl hover:-translate-y-2 transition-transform duration-300 bg-card group flex flex-col"
            >
              <div className="aspect-[16/9] bg-secondary w-full border-b-4 border-foreground relative overflow-hidden flex items-center justify-center">
                <Share2 className="w-24 h-24 text-secondary-foreground transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-display font-bold uppercase mb-4 text-card-foreground">Share Instantly</h3>
                  <p className="text-card-foreground/80 font-medium text-lg mb-6">The moment you hit stop, a link is copied to your clipboard. No uploading, no waiting.</p>
                </div>
                <Badge className="w-fit text-sm font-bold uppercase tracking-wider px-3 py-1 bg-secondary text-secondary-foreground border-2 border-foreground rounded-none shadow-sm">Zero Wait Time</Badge>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="border-4 border-foreground rounded-xl overflow-hidden shadow-xl hover:-translate-y-2 transition-transform duration-300 bg-card group flex flex-col"
            >
              <div className="aspect-[16/9] bg-destructive w-full border-b-4 border-foreground relative overflow-hidden flex items-center justify-center">
                <Scissors className="w-24 h-24 text-destructive-foreground transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-display font-bold uppercase mb-4 text-card-foreground">Trim the Fat</h3>
                  <p className="text-card-foreground/80 font-medium text-lg mb-6">Messed up the intro? Sneezed at the end? Chop it off with the built-in lightning-fast editor.</p>
                </div>
                <Badge className="w-fit text-sm font-bold uppercase tracking-wider px-3 py-1 bg-destructive text-destructive-foreground border-2 border-foreground rounded-none shadow-sm">Easy Edits</Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. How it Works (Steps) */}
      <section className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-secondary text-secondary-foreground relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-display font-black uppercase text-center mb-6 text-secondary-foreground">As simple as 1, 2, 3.</h2>
          <motion.img
            src={hammockNacho}
            alt="A relaxed nacho mascot lounging in a hammock with a drink"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-xl mx-auto object-contain mb-20"
          />

          <div className="space-y-16">
            {[
              { num: "01", title: "Hit Record", desc: "Click the Nacho icon or use the global shortcut to start capturing." },
              { num: "02", title: "Talk it out", desc: "Show your screen, point things out, explain exactly what you mean." },
              { num: "03", title: "Paste the link", desc: "Stop recording and immediately paste the link into Slack, Email, or anywhere." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12"
              >
                <div className="text-8xl md:text-[10rem] font-display font-black text-primary leading-none shadow-md">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-display font-bold uppercase mb-4 text-secondary-foreground">{step.title}</h3>
                  <p className="text-xl md:text-2xl font-medium text-secondary-foreground/80 max-w-xl">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Big Testimonial */}
      <section className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <MessageSquare className="w-16 h-16 mx-auto mb-8 text-foreground" />
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase leading-tight text-foreground mb-12">
              "We banned internal meetings. Now we just send Nachos. Productivity is up 400% and nobody is mad about it."
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-foreground bg-background overflow-hidden">
                <div className="w-full h-full bg-secondary"></div>
              </div>
              <div className="text-left">
                <div className="font-display font-bold text-2xl uppercase text-foreground">Sarah Jenkins</div>
                <div className="font-medium text-foreground/80">VP of Getting Things Done</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Integrations */}
      <section className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-display font-black uppercase mb-6 text-foreground">Plays nice with others</h2>
          <p className="text-xl font-medium text-foreground/80 max-w-2xl mx-auto">Paste a Nacho link anywhere and it automatically unfurls into a beautiful playable embed.</p>
        </div>

        {/* Marquee effect */}
        <div className="relative flex overflow-x-hidden">
          <motion.div 
            className="flex gap-8 whitespace-nowrap px-4"
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            {['Slack', 'Notion', 'Linear', 'Jira', 'GitHub', 'Figma', 'Discord', 'Gmail', 'Confluence', 'Trello'].map((tool, i) => (
              <div key={i} className="px-8 py-4 border-4 border-foreground bg-card text-card-foreground shadow-lg font-display font-bold text-2xl uppercase inline-flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-foreground" />
                {tool}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. CTA */}
      <section className="py-32 px-6 md:px-12 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-8xl font-display font-black uppercase tracking-tight mb-8">
            Ready to stop typing?
          </h2>
          <p className="text-2xl font-medium text-background/80 mb-12">
            Join 100,000+ people who communicate better, faster.
          </p>
          <Button asChild size="lg" className="h-20 px-12 text-2xl font-display font-black uppercase tracking-wider border-4 border-foreground shadow-xl hover:translate-y-[4px] hover:shadow-lg transition-all bg-primary text-foreground hover:bg-primary/90 rounded-none">
            <Link href="/sign-up">Get Nacho For Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t-4 border-foreground bg-background text-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-10" />
          </Link>
          <div className="flex gap-6 font-medium font-bold text-foreground/80">
            <a href="#" className="hover:text-foreground hover:underline transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground hover:underline transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-foreground hover:underline transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground hover:underline transition-colors">Terms</a>
            <a href="/design-system/" className="hover:text-foreground hover:underline transition-colors">Design System</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
