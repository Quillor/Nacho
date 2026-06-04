import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Share2, Scissors, Zap, MessageSquare, ArrowRight, Play, CheckCircle2 } from "lucide-react";

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
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary border-2 border-foreground shadow-sm rounded-sm flex items-center justify-center">
            <Video className="w-6 h-6 text-foreground" />
          </div>
          <span className="font-display font-black text-2xl uppercase tracking-tight">Nacho</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden md:flex font-bold border-2 border-transparent text-foreground hover:bg-muted transition-all">
            Login
          </Button>
          <Button className="font-bold border-2 border-foreground shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all bg-primary text-foreground hover:bg-primary/90">
            Get Started
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
              <Button size="lg" className="h-16 px-8 text-lg font-bold border-4 border-foreground shadow-lg hover:translate-y-[2px] hover:shadow-md transition-all bg-background text-foreground hover:bg-background/90 rounded-none">
                Start Recording Free
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-8 text-lg font-bold border-4 border-foreground shadow-lg hover:translate-y-[2px] hover:shadow-md transition-all bg-transparent text-foreground hover:bg-foreground hover:text-background rounded-none">
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="border-4 border-foreground shadow-xl bg-background rounded-xl overflow-hidden aspect-video relative">
              <img src={`${import.meta.env.BASE_URL}hero-mockup.png`} alt="Nacho Interface" className="w-full h-full object-cover" />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-primary border-4 border-foreground rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-foreground ml-2" />
                </div>
              </div>
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
        <div className="max-w-5xl mx-auto text-center">
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
            className="text-xl md:text-2xl font-medium text-background/80 max-w-3xl mx-auto"
          >
            Emails get misread. Meetings take too long. A quick Nacho video captures your tone, your screen, and your exact point in seconds.
          </motion.p>
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
              <div className="aspect-[4/3] bg-muted w-full border-b-4 border-foreground relative overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}feature-camera.png`} alt="Record" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
              <div className="aspect-[4/3] bg-muted w-full border-b-4 border-foreground relative overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}feature-share.png`} alt="Share" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
              <div className="aspect-[4/3] bg-muted w-full border-b-4 border-foreground relative overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}feature-trim.png`} alt="Trim" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
          <h2 className="text-5xl md:text-7xl font-display font-black uppercase text-center mb-24 text-secondary-foreground">As simple as 1, 2, 3.</h2>

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
                <CheckCircle2 className="w-6 h-6 text-primary" />
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
          <Button size="lg" className="h-20 px-12 text-2xl font-display font-black uppercase tracking-wider border-4 border-foreground shadow-xl hover:translate-y-[4px] hover:shadow-lg transition-all bg-primary text-foreground hover:bg-primary/90 rounded-none">
            Get Nacho For Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t-4 border-foreground bg-background text-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Video className="w-8 h-8 text-foreground" />
            <span className="font-display font-black text-3xl uppercase tracking-tight">Nacho</span>
          </div>
          <div className="flex gap-6 font-medium font-bold text-foreground/80">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
