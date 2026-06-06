import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Badge } from "@workspace/pico-ui/badge";
import { Video, Share2, Scissors, Zap, MessageSquare, CheckCircle2 } from "lucide-react";
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

const features = [
  {
    icon: Video,
    media: "bg-accent",
    iconColor: "text-foreground",
    title: "Record in a snap",
    desc: "Capture your screen, your face, or both in a quick clip. Nacho lives in your menu bar, ready to roll in seconds.",
    badge: "Quick clips",
    badgeVariant: "default" as const
  },
  {
    icon: Share2,
    media: "bg-primary",
    iconColor: "text-primary-foreground",
    title: "Share with everyone",
    desc: "The moment you hit stop, a link lands on your clipboard. Record once and send it to one teammate or the whole company.",
    badge: "Record once, reach many",
    badgeVariant: "secondary" as const
  },
  {
    icon: Scissors,
    media: "bg-destructive",
    iconColor: "text-destructive-foreground",
    title: "Keep it snackable",
    desc: "Messed up the intro? Rambled at the end? Trim it down to the good parts so every clip stays short and easy to digest.",
    badge: "Bite-sized",
    badgeVariant: "destructive" as const
  }
];

const steps = [
  { num: "01", title: "Hit record", desc: "Click the Nacho icon or use the global shortcut. Most clips are done in under two minutes." },
  { num: "02", title: "Make your point", desc: "Show your screen, point things out, explain it once — clearly, the way you would in person." },
  { num: "03", title: "Share with everyone", desc: "Drop the link into Slack, email, or anywhere. Send it to one person or a hundred — you only had to record it once." }
];

const integrations = ['Slack', 'Notion', 'Linear', 'Jira', 'GitHub', 'Figma', 'Discord', 'Gmail', 'Confluence', 'Trello'];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-accent selection:text-accent-foreground font-sans">

      {/* Navigation */}
      <nav data-pico-section="navbar" className="fixed top-0 left-0 right-0 z-50 border-b-4 border-foreground bg-background py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Nacho home">
          <Logo className="h-9" />
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden md:flex">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main>

      {/* 1. Hero Section */}
      <section data-pico-section="hero" className="relative pt-40 pb-24 px-6 md:px-12 border-b-4 border-foreground overflow-hidden bg-accent">
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-2xl"
          >
            <motion.div variants={fadeIn} className="inline-block mb-6">
              <Badge variant="outline" className="px-4 py-2 text-sm uppercase tracking-wider">
                Snack-sized screen clips
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl font-display font-extrabold tracking-tight leading-[0.9] mb-8 text-foreground">
              Send a clip. <br/> Save a meeting.
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl md:text-2xl font-medium leading-relaxed text-foreground/80 mb-10 max-w-lg">
              Record a snackable screen walkthrough in seconds and drop the link wherever your team works. They watch on their own time — and the meeting that could've been an email never happens.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Button asChild size="lg" variant="secondary" className="border-2 border-foreground shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all">
                <Link href="/sign-up">Start Recording Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-foreground shadow-sm hover:translate-y-[2px] hover:shadow-xs transition-all">
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
            <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground font-display font-extrabold text-2xl py-3 px-6 border-4 border-foreground shadow-lg -rotate-6">
              Skip the meeting!
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Value Prop */}
      <section data-pico-section="value-prop" className="py-24 px-6 md:px-12 border-b-4 border-foreground bg-foreground text-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 md:order-1"
          >
            <img src={emptyBowlNacho} alt="A sad nacho mascot leaning on an empty bowl" className="w-full max-w-md mx-auto object-contain" />
          </motion.div>
          <div className="order-1 md:order-2 text-center md:text-left">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.05] mb-8"
            >
              Why book a meeting <br/>
              <span className="text-foreground">when a snack will do?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl font-medium leading-relaxed text-background/80"
            >
              Calendars fill up and threads get misread. A quick Nacho clip captures your screen, your voice, and your exact point — bite-sized enough to digest in a minute, watched on their schedule instead of stealing everyone's.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section data-pico-section="features" className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent border-4 border-foreground rounded-sm shadow-xs flex items-center justify-center">
              <Zap className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-foreground">Power Moves</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-4 border-foreground shadow-xl overflow-hidden hover:-translate-y-2 transition-transform duration-300 group flex flex-col">
                    <div className={`aspect-[16/9] w-full border-b-4 border-foreground relative overflow-hidden flex items-center justify-center ${feature.media}`}>
                      <Icon className={`w-24 h-24 transition-transform duration-500 group-hover:scale-110 ${feature.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-3xl font-display font-extrabold leading-[1.1] tracking-tight mb-4 text-card-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground font-medium text-lg mb-6">{feature.desc}</p>
                      </div>
                      <Badge variant={feature.badgeVariant} className="w-fit uppercase tracking-wider">{feature.badge}</Badge>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How it Works (Steps) */}
      <section data-pico-section="how-it-works" className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-center mb-6 text-primary-foreground">Record once, share with everyone.</h2>
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
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12"
              >
                <div className="text-8xl md:text-9xl font-display font-extrabold text-foreground leading-none tracking-tight">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-primary-foreground">{step.title}</h3>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed text-primary-foreground/80 max-w-xl">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Big Testimonial */}
      <section data-pico-section="testimonial" className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-accent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <MessageSquare className="w-16 h-16 mx-auto mb-8 text-foreground" />
            <h2 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.05] text-foreground mb-12">
              "We swapped our standup for snackable Nachos. I record once and the whole team watches whenever — it's like being in ten places at once without repeating myself."
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-foreground bg-background overflow-hidden">
                <div className="w-full h-full bg-primary"></div>
              </div>
              <div className="text-left">
                <div className="font-display font-extrabold text-2xl text-foreground">Sarah Jenkins</div>
                <div className="font-medium text-foreground/80">VP of Skipping Meetings</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Integrations */}
      <section data-pico-section="integrations" className="py-32 px-6 md:px-12 border-b-4 border-foreground bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6 text-foreground">Plays nice with others</h2>
          <p className="text-xl font-medium leading-relaxed text-foreground/80 max-w-2xl mx-auto">Drop a Nacho link wherever your team already works and it unfurls into a beautiful, playable clip — no app to install, no meeting to schedule.</p>
        </div>

        {/* Marquee effect */}
        <div className="relative flex overflow-x-hidden">
          <motion.div
            className="flex gap-8 whitespace-nowrap px-4"
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          >
            {integrations.map((tool) => (
              <div key={tool} className="px-8 py-4 border-4 border-foreground bg-card text-card-foreground shadow-lg font-display font-extrabold text-2xl inline-flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-foreground" />
                {tool}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. CTA */}
      <section data-pico-section="cta" className="py-32 px-6 md:px-12 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-8xl font-display font-extrabold tracking-tight mb-8">
            Ready to multiply yourself?
          </h2>
          <p className="text-2xl font-medium leading-relaxed text-background/80 mb-12">
            Join 100,000+ people who record once, skip the meeting, and show up everywhere at once.
          </p>
          <Button asChild size="lg" variant="brand" className="text-lg uppercase tracking-wider">
            <Link href="/sign-up">Get Nacho For Free</Link>
          </Button>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer data-pico-section="footer" className="py-12 px-6 md:px-12 border-t-4 border-foreground bg-background text-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-10" />
          </Link>
          <div className="flex gap-6 font-bold text-foreground/80">
            <a href="#" className="hover:text-foreground hover:underline transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground hover:underline transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-foreground hover:underline transition-colors">Privacy</a>
            <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">Terms</Link>
            <a href="/design-system/" className="hover:text-foreground hover:underline transition-colors">Design System</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
