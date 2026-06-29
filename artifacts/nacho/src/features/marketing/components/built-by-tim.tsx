import { motion } from "framer-motion";
import { Button } from "@workspace/pico-ui/button";
import { Badge } from "@workspace/pico-ui/badge";
import { Rocket, Sparkles, ArrowUpRight, Wrench } from "lucide-react";
import { MarketingNav, MarketingFooter } from "./marketing-chrome";

const TIM_URL = "https://timrosenberg.replit.app/";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const highlights = [
  {
    icon: Rocket,
    title: "Rapid MVPs",
    desc: "Go from idea to a working product fast. Tim ships real, usable software in days — not months.",
  },
  {
    icon: Wrench,
    title: "Built end to end",
    desc: "Design, frontend, backend, and the polish in between. Nacho itself is proof of the whole stack done solo.",
  },
  {
    icon: Sparkles,
    title: "Made to delight",
    desc: "A bold, playful product feel that makes people actually want to use what you build.",
  },
];

export function BuiltByTim() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingNav active="built-by-tim" />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-40 pb-20 px-6 md:px-12 border-b-2 border-foreground bg-accent">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Badge variant="secondary" className="mb-6">
                The story behind Nacho
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-accent-foreground">
                Built by Tim Rosenberg
              </h1>
              <p className="mt-6 text-lg md:text-xl text-accent-foreground/80 max-w-2xl mx-auto">
                Nacho is a project by Tim Rosenberg — a designer-developer who
                builds bold, playful products end to end. If you have an idea,
                Tim can help you turn it into a rapid MVP.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button asChild variant="brand" size="lg">
                  <a href={TIM_URL} target="_blank" rel="noopener noreferrer">
                    Work with Tim
                    <ArrowUpRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-20 px-6 md:px-12 border-b-2 border-foreground">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="border-2 border-foreground bg-card p-8 rounded-lg"
                  >
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground border-2 border-foreground mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black mb-2">{item.title}</h2>
                    <p className="text-foreground/70">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-24 px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Have an idea? Let&apos;s build it.
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              Tim partners with founders and teams to ship rapid MVPs that look
              great and actually work. See more of his work and get in touch.
            </p>
            <div className="mt-8">
              <Button asChild variant="brand" size="lg">
                <a href={TIM_URL} target="_blank" rel="noopener noreferrer">
                  Visit timrosenberg.replit.app
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter active="built-by-tim" />
    </div>
  );
}
