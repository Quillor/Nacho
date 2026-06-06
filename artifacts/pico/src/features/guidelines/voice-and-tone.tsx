import { PRINCIPLES, TONES } from "./voice-and-tone-data";
import { ScenariosSection } from "./voice-and-tone-scenarios";

export default function ContentGuidelines() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-block border border-foreground bg-accent px-4 py-2 text-sm font-bold uppercase tracking-widest shadow-sm text-accent-foreground">
          GUIDELINES
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-[0.9] tracking-tight text-foreground md:text-6xl">
          Voice &amp; Tone
        </h1>
        <p className="max-w-2xl pt-2 text-xl font-medium leading-relaxed text-foreground/80">
          How Pico sounds. Bold, chunky, and impossible to ignore — the same
          energy as the type and the color. These are copy-pasteable rules for
          every screen in the app, so whoever's writing, it always sounds like
          us.
        </p>
      </div>

      {/* Voice vs Tone */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-2 border-foreground bg-foreground p-6 text-background shadow-md">
          <h2 className="mb-2 font-display text-2xl font-extrabold text-background">
            Voice
          </h2>
          <p className="font-medium leading-relaxed text-background/90">
            Our personality. It never changes — we're always confident, chunky,
            and a little playful, whether we're celebrating a publish or
            explaining a denied permission.
          </p>
        </div>
        <div className="border-2 border-foreground bg-background p-6 shadow-md">
          <h2 className="mb-2 font-display text-2xl font-extrabold">
            Tone
          </h2>
          <p className="font-medium leading-relaxed text-foreground/80">
            How the voice flexes for the moment. Celebratory on a win, calm and
            helpful on an error. Same person, different room.
          </p>
        </div>
      </div>

      {/* Principles */}
      <section className="space-y-8">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-3xl font-extrabold">
          Voice Principles
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.name}
              className="flex flex-col border-2 border-foreground bg-background p-6 shadow-md transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl font-extrabold leading-none">
                  {p.name}
                </h3>
              </div>
              <p className="font-medium leading-relaxed text-foreground/80">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tone by context */}
      <section className="space-y-8">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-3xl font-extrabold">
          Tone by Context
        </h2>
        <div className="overflow-hidden border-2 border-foreground shadow-md">
          {TONES.map((t, i) => (
            <div
              key={t.when}
              className={`grid gap-2 p-5 md:grid-cols-[1fr_1fr_2fr] md:items-center md:gap-6 ${
                i !== 0 ? "border-t-2 border-foreground" : ""
              } ${i % 2 === 1 ? "bg-card" : "bg-background"}`}
            >
              <div className="font-display text-lg font-extrabold leading-tight">
                {t.when}
              </div>
              <div>
                <span className="inline-block border border-foreground bg-accent px-3 py-1 text-sm font-bold uppercase text-accent-foreground shadow-sm">
                  {t.tone}
                </span>
              </div>
              <p className="font-medium leading-relaxed text-foreground/80">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <ScenariosSection />

      {/* Closing rule of thumb */}
      <section className="border-2 border-foreground bg-accent p-8 shadow-md md:p-12">
        <h2 className="font-display text-3xl font-extrabold leading-tight text-accent-foreground md:text-4xl">
          The 5-second test
        </h2>
        <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-accent-foreground/80">
          Read your copy out loud. If it sounds like a robot, a lawyer, or a
          help-desk ticket — rewrite it. If it sounds like a confident friend
          who's in a hurry and genuinely wants to help, ship it.
        </p>
      </section>
    </div>
  );
}
