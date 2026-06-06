import { Section, Note } from "@/components/docs/shared";
import { ThumbGrid } from "./ui";
import { POSES, EXPRESSIONS, ASSET_TABLE, ASSET_FILES } from "./data";

export function ExpressionLibrary() {
  return (
    <Section title="Expression Library">
      <Note>
        Every expression preserves Nacho&rsquo;s core facial structure: large oval
        eyes, a single rounded nose, a bold mouth, and simple curved brows. Never
        change the eye style, add teeth, or make expressions scary.
      </Note>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {EXPRESSIONS.map((e) => (
          <div
            key={e.name}
            className="flex flex-col overflow-hidden rounded-sm border-2 border-foreground bg-background shadow-sm"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden border-b-2 border-foreground bg-[#FFF8DC] p-4">
              <img
                src={e.src}
                alt={`${e.name} expression`}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h4 className="text-lg font-bold leading-none">{e.name}</h4>
              <p className="text-sm font-medium leading-relaxed text-foreground/70">
                {e.desc}
              </p>
              <p className="mt-auto pt-2 text-sm font-medium text-foreground/60">
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                  Use for{" "}
                </span>
                {e.usage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function PoseLibrary() {
  return (
    <Section title="Pose Library">
      <Note>
        Eleven canonical poses cover most product and marketing moments. Match the
        pose to the message, and keep arms, legs, gloves, and shoes readable.
      </Note>
      <ThumbGrid items={POSES} cols="lg:grid-cols-3" stage="accent" />
    </Section>
  );
}

export function AssetReferenceTable() {
  return (
    <Section title="Asset Reference Table">
      <Note>
        All 24 high-resolution source assets, served from{" "}
        <code className="rounded-sm bg-foreground/10 px-1 font-mono">/nacho/</code>.
        Character poses ship with transparent backgrounds; reference them by their
        exact file name when wiring illustrations into code.
      </Note>
      <div className="overflow-x-auto rounded-sm border-2 border-foreground shadow-md">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-foreground font-display text-sm uppercase text-background">
              <th className="p-4">File</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Recommended usage</th>
            </tr>
          </thead>
          <tbody className="font-medium text-foreground/80">
            {ASSET_TABLE.map((row, i) => (
              <tr
                key={row.n}
                className={i % 2 === 0 ? "bg-background" : "bg-background/50"}
              >
                <td className="border-t border-foreground/10 p-4">
                  <code className="whitespace-nowrap rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-xs">
                    {ASSET_FILES[row.n]}
                  </code>
                </td>
                <td className="border-t border-foreground/10 p-4 font-bold text-foreground">
                  {row.type}
                </td>
                <td className="border-t border-foreground/10 p-4">
                  {row.description}
                </td>
                <td className="border-t border-foreground/10 p-4">{row.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
