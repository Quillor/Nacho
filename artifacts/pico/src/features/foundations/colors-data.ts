import tokens from "@workspace/pico-theme/tokens.json";

export type ColorToken = { hsl: string; css: string; hex: string };
export type PrimitiveShade = ColorToken & { step: number };
export type SemanticToken = {
  role: string;
  token: string;
  tailwind: string;
  figmaName: string;
  light: ColorToken;
  dark: ColorToken;
};
export type SemanticGroup = {
  group: string;
  label: string;
  blurb: string;
  tokens: SemanticToken[];
};

export const primitives = tokens.primitives as Record<string, PrimitiveShade[]>;
export const semanticGroups = tokens.semanticGroups as SemanticGroup[];

/** Flat lookup of every semantic token by its Figma variable name. */
export const tokenByFigma = new Map<string, SemanticToken>();
for (const g of semanticGroups) {
  for (const t of g.tokens) tokenByFigma.set(t.figmaName, t);
}

export const RAMPS: { hue: string; label: string; blurb: string }[] = [
  { hue: "yellow", label: "Yellow", blurb: "Primary brand fill. Loud highlights, hero moments, CTAs." },
  { hue: "brown", label: "Brown", blurb: "The unified ramp. Light shades for canvas, mid shades for secondary surfaces, deep shades for ink." },
  { hue: "red", label: "Red", blurb: "Danger and destructive actions. Used sparingly." },
];

// Maps a semantic token's role to the Tailwind utility prefix it is consumed
// through, so the docs render the exact class authors should type (e.g. a
// `background` role → `bg-`, an `element`/`foreground` role → `text-`).
const ROLE_PREFIX: Record<string, string> = {
  background: "bg",
  element: "text",
  foreground: "text",
  "accent-foreground": "text",
  border: "border",
  ring: "ring",
};

export function tailwindClass(t: SemanticToken) {
  return `${ROLE_PREFIX[t.role] ?? "bg"}-${t.tailwind}`;
}

// Brown ramp steps 500+ are dark enough that swatch labels need light ink to
// stay legible; lighter steps keep dark ink.
export function needsLightText(step: number) {
  return step >= 500;
}
