import { PatternPage, PageHeader, Section, PatternIndexCard, Note } from "./_shared";

const PATTERNS = [
  {
    title: "Forms",
    href: "/patterns/forms",
    desc: "Label, helper, and validation layout. Required fields and where submit/cancel go.",
  },
  {
    title: "Layout & Nav",
    href: "/patterns/layout",
    desc: "App shell, top nav, page headers, back navigation, and active states.",
  },
  {
    title: "Empty States",
    href: "/patterns/empty-states",
    desc: "Icon, heading, supporting copy, and a single primary action to get unstuck.",
  },
  {
    title: "Loading & Progress",
    href: "/patterns/loading",
    desc: "When to reach for spinners, skeletons, or a determinate progress bar.",
  },
  {
    title: "Feedback",
    href: "/patterns/feedback",
    desc: "Toasts vs. inline alerts vs. dialogs, and how success and error read.",
  },
  {
    title: "Confirmation",
    href: "/patterns/confirmation",
    desc: "The confirm dialog for destructive actions: wording and button hierarchy.",
  },
  {
    title: "Cards & Lists",
    href: "/patterns/cards-lists",
    desc: "Recording cards, the library grid, and a consistent metadata layout.",
  },
  {
    title: "Overlays",
    href: "/patterns/overlays",
    desc: "Dialog, sheet, or drawer — when to use each and how they are built.",
  },
];

export default function PatternsOverview() {
  return (
    <PatternPage>
      <PageHeader
        eyebrow="PATTERNS"
        title="Patterns"
        intro="Components are the bricks. Patterns are the blueprints — the approved way to combine those bricks so every screen solves the same problem the same way. Reach for a pattern before you invent one."
      />

      <Section title="Why patterns">
        <Note>
          A button is a button anywhere, but a form, an empty state, or a confirm
          dialog is a <em>composition</em> of components. Without an agreed shape,
          each screen drifts: one form puts cancel on the left, another on the
          right; one empty state shows an action, another a dead end. These
          patterns lock in a single answer so the product feels like one thing.
        </Note>
        <Note>
          Each pattern points back to the components it is built from and, where
          copy matters, to the content guidelines for voice and tone. If a real
          situation isn't covered here, extend the closest pattern rather than
          starting fresh.
        </Note>
      </Section>

      <Section title="The patterns">
        <div className="grid gap-6 md:grid-cols-2">
          {PATTERNS.map((p) => (
            <PatternIndexCard key={p.href} {...p} />
          ))}
        </div>
      </Section>
    </PatternPage>
  );
}
