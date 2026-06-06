import { useState } from "react";
import { Check, Copy } from "lucide-react";

import sadNachoEmptyBowl from "@workspace/nacho-illustrations/assets/sad-nacho-empty-bowl.png";
import nachoPresentingLaptop from "@workspace/nacho-illustrations/assets/nacho-presenting-laptop.png";
import jalapenoCharacter from "@workspace/nacho-illustrations/assets/jalapeno-character.png";
import nachoCheeseJump from "@workspace/nacho-illustrations/assets/nacho-cheese-jump.png";
import nachoVideoLesson from "@workspace/nacho-illustrations/assets/nacho-video-lesson.png";
import nachoHammock from "@workspace/nacho-illustrations/assets/nacho-hammock.png";
import nachoDipSalesPlayer from "@workspace/nacho-illustrations/assets/nacho-dip-sales-player.png";

interface Illustration {
  src: string;
  name: string;
  file: string;
  caption: string;
  usage: string;
}

const ILLUSTRATIONS: Illustration[] = [
  {
    src: nachoCheeseJump,
    name: "Cheese Jump",
    file: "nacho-cheese-jump",
    caption: "Nacho leaping out of a bubbling cheese bowl.",
    usage: "Hero moments, success states, and big celebratory call-to-actions.",
  },
  {
    src: nachoPresentingLaptop,
    name: "Presenting Laptop",
    file: "nacho-presenting-laptop",
    caption: "Nacho presenting \u201CNACHOS\u201D on a laptop screen.",
    usage: "Onboarding, feature explainers, and \u201Chow it works\u201D sections.",
  },
  {
    src: nachoVideoLesson,
    name: "Video Lesson",
    file: "nacho-video-lesson",
    caption: "Nacho holding a pointer, mid-lesson teaching pose.",
    usage: "Tutorials, recorded lessons, and anything video-related.",
  },
  {
    src: nachoHammock,
    name: "Hammock",
    file: "nacho-hammock",
    caption: "Nacho relaxing in a hammock with a margarita between palms.",
    usage: "Empty states for \u201Call done\u201D, downtime, and laid-back messaging.",
  },
  {
    src: sadNachoEmptyBowl,
    name: "Empty Bowl",
    file: "sad-nacho-empty-bowl",
    caption: "A sad nacho leaning on an empty bowl.",
    usage: "Empty states, zero-results screens, and gentle error moments.",
  },
  {
    src: jalapenoCharacter,
    name: "Jalape\u00F1o Sidekick",
    file: "jalapeno-character",
    caption: "A seated jalape\u00F1o character, the friendly sidekick.",
    usage: "Secondary characters, testimonials, and supporting illustrations.",
  },
  {
    src: nachoDipSalesPlayer,
    name: "Dip Sales Player",
    file: "nacho-dip-sales-player",
    caption: "Nacho presenting a \u201CNacho Dip Sales\u201D dashboard inside a video player.",
    usage: "Product shots, hero mockups, and demo or feature showcases.",
  },
];

const PROMPT_TEMPLATE = `Retro 1930s rubber-hose cartoon illustration of {SUBJECT/SCENE}.
Style: vintage mascot character art with thick, confident black outlines, bold
flat color fills, subtle cel-shading, and slightly grainy vintage texture.
Rubber-hose limbs, oversized white gloves and shoes, big expressive pie-cut eyes,
and a cheerful exaggerated face.
Palette: golden yellow (#F5C518), deep brown (#2E1C0F), and warm brown (#F8F4E6),
with small accents only where the scene needs them.
Composition: single character (or small group) centered, full body, dynamic but
readable pose, soft ground shadow.
Background: plain solid white / transparent, no scenery unless described in the
subject, no text unless described.
Mood: playful, friendly, snack-brand energy.`;

const EXAMPLE_FILLS = [
  "a triangular tortilla-chip mascot leaping joyfully out of a bowl of melted cheese",
  "a tortilla-chip mascot presenting a slideshow on a laptop, pointing at the screen",
  "a tortilla-chip mascot relaxing in a striped hammock holding a margarita between two palm trees",
];

export default function Imagery() {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Imagery
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Pico ships with a cast of retro-cartoon nacho characters. They're loud, friendly, and unmistakably on-brand. Use them to add personality without breaking the system &mdash; one illustration per moment, never a crowd.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold">The Cast</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ILLUSTRATIONS.map((ill) => (
            <div
              key={ill.file}
              className="group border-2 border-foreground rounded-sm overflow-hidden shadow-md bg-background flex flex-col hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="aspect-square w-full bg-accent/10 border-b-2 border-foreground p-6 flex items-center justify-center overflow-hidden">
                <img
                  src={ill.src}
                  alt={ill.caption}
                  className="max-h-full max-w-full object-contain drop-shadow-[3px_3px_0px_hsl(var(--foreground)/0.15)] group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between gap-2">
 <h3 className="text-xl font-bold leading-none">{ill.name}</h3>
                </div>
                <code className="font-mono text-xs bg-foreground/10 px-1.5 py-0.5 rounded-sm w-fit">{ill.file}</code>
                <p className="text-foreground/80 font-medium text-sm mt-1">{ill.caption}</p>
                <p className="text-foreground/60 font-medium text-sm mt-auto pt-2">
                  <span className="font-bold uppercase tracking-wide text-xs text-foreground/50">Use for </span>
                  {ill.usage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
 <h2 className="text-3xl font-display font-extrabold">Usage Guidance</h2>
        <ul className="space-y-3 max-w-2xl">
          {[
            "One illustration per view. These characters are loud; let a single one own the moment.",
            "Keep the transparent background. Drop them onto light, yellow, or dark brown surfaces \u2014 never re-add a white box.",
            "Don't recolor, skew, or add filters. The palette and outlines are the brand.",
            "Match the character to the moment: hammock for empty/done states, cheese-jump for celebrations, empty-bowl for zero-results.",
          ].map((tip, i) => (
            <li key={i} className="flex gap-3 font-medium text-foreground/80">
              <span className="font-display font-extrabold text-accent-foreground bg-foreground rounded-sm w-6 h-6 shrink-0 flex items-center justify-center text-sm">{i + 1}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
 <h2 className="text-3xl font-display font-extrabold">Prompt Template</h2>
        <p className="font-medium text-foreground/80 max-w-2xl">
          Need a new illustration? Generate it in the exact same style. Copy the template below and replace <code className="bg-foreground/10 px-1 rounded-sm">{"{SUBJECT/SCENE}"}</code> with what you want to show.
        </p>

        <div className="relative">
          <button
            onClick={copyPrompt}
            aria-label="Copy prompt template"
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-accent text-accent-foreground border border-foreground rounded-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-xs hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <pre className="bg-foreground text-background p-5 pt-14 rounded-sm border-2 border-foreground overflow-x-auto text-sm font-mono leading-relaxed shadow-[4px_4px_0px_0px_var(--primary)] whitespace-pre-wrap">
            <code>{PROMPT_TEMPLATE}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/50">Example fills for {"{SUBJECT/SCENE}"}</h3>
          <ul className="space-y-2 max-w-2xl">
            {EXAMPLE_FILLS.map((ex, i) => (
              <li key={i} className="font-mono text-sm bg-accent/10 border border-foreground/20 rounded-sm px-3 py-2 text-foreground/80">
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
