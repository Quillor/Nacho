import { Section, Note } from "@/components/docs/shared";
import { AssetThumb, RuleList, TagCloud, ThumbGrid } from "./ui";
import {
  DETAILS,
  PERSONALITY,
  NOT_PERSONALITY,
  SLICES,
  ASSET_FILES,
} from "./data";

export function Overview() {
  return (
    <Section title="Overview">
      <div className="grid items-start gap-8 md:grid-cols-[1fr_1.3fr]">
        <div className="overflow-hidden rounded-sm border-2 border-foreground bg-[#FFF8DC] shadow-md">
          <img
            src={SLICES[17]}
            alt="Nacho close-up face and chip body"
            className="w-full"
          />
        </div>
        <div className="space-y-4">
          <Note>
            Nacho is the primary brand mascot &mdash; a living tortilla chip whose
            single chip-shaped body also functions as its head. The character
            should feel cheerful, helpful, confident, expressive, and a little
            playful. It works best as a guide, presenter, celebrator, or friendly
            visual accent.
          </Note>
          <Note>
            Never let Nacho feel corporate, sterile, realistic, glossy, 3D, or
            overly polished.
          </Note>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-foreground/50">
            Personality
          </h3>
          <TagCloud items={PERSONALITY} tone="do" />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-widest text-foreground/50">
            Never portray Nacho as
          </h3>
          <TagCloud items={NOT_PERSONALITY} tone="dont" />
        </div>
      </div>
    </Section>
  );
}

export function Proportions() {
  return (
    <Section title="Character Proportions">
      <Note>
        Nacho&rsquo;s body is a rounded triangular tortilla chip with irregular
        scalloped edges &mdash; intentionally imperfect and organic, never a
        perfect triangle. Eyes, mouth, gloves, and shoes stay oversized and
        graphic so the character reads clearly even at small sizes.
      </Note>
      <div className="grid items-start gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-sm border-2 border-foreground bg-[#FFF8DC] shadow-md">
          <img src={SLICES[18]} alt="Nacho measured proportion reference" className="w-full" />
          <p className="border-t-2 border-foreground p-4 text-sm font-bold uppercase tracking-wide text-foreground/60">
            {ASSET_FILES[18]} &middot; measured proportion guide &middot; W:H &asymp; 1.15:1
          </p>
        </div>
        <div className="space-y-4">
          <RuleList
            items={[
              "Body shape: wide rounded triangle, width-to-height \u2248 1.15:1",
              "Head and torso are one continuous chip shape",
              "Eyes sit in the upper-center area of the chip",
              "Nose sits between and slightly below the eyes",
              "Mouth sits below the nose, centered slightly low",
              "Arms attach to the left and right sides of the chip",
              "Legs attach under the lower edge; shoes are large and rounded",
              "Gloves are oversized compared to the thin arms",
            ]}
          />
          <AssetThumb
            src={SLICES[11]}
            label={ASSET_FILES[11]}
            name="Neutral full-body reference"
            blurb="Use as the canonical baseline whenever you need the whole character."
            stage="cream"
          />
        </div>
      </div>
    </Section>
  );
}

export function ShapeLanguage() {
  return (
    <Section title="Shape Language">
      <Note>
        Nacho&rsquo;s silhouette is built from soft, rounded, vintage cartoon
        shapes. The toasted side edge adds depth and makes the mascot feel like a
        real chip without ever becoming realistic.
      </Note>
      <div className="grid items-start gap-8 md:grid-cols-[1.2fr_1fr]">
        <RuleList
          items={[
            "Rounded triangular chip body, puffy and slightly dimensional",
            "Uneven scalloped edge with small bumps \u2014 no sharp corners",
            "Toasted orange-brown side edge visible on one side",
            "Organic curves instead of geometric precision",
            "No perfectly straight sides",
            "The toasted edge reads as a dimensional side plane on the left or rear",
          ]}
        />
        <div className="grid grid-cols-2 gap-6">
          <AssetThumb src={SLICES[16]} label={ASSET_FILES[16]} name="Scalloped edge" stage="cream" />
          <AssetThumb src={SLICES[20]} label={ASSET_FILES[20]} name="Toasted side" stage="cream" />
        </div>
      </div>
    </Section>
  );
}

export function LineQuality() {
  return (
    <Section title="Line Quality">
      <Note>
        Nacho uses bold, hand-inked cartoon linework inspired by 1930s animation.
        The lines should feel confident and printed &mdash; never delicate,
        technical, or digital-first.
      </Note>
      <div className="grid items-start gap-8 md:grid-cols-[1.2fr_1fr]">
        <RuleList
          items={[
            "Outer character outline is thick and black",
            "Inner facial details are slightly thinner but still bold",
            "Arms and legs are solid black rubber-hose forms",
            "Lines feel hand-drawn, with organic curves and subtle wobble",
            "Avoid mechanical vector precision and thin outlines",
            "Avoid clean corporate icon strokes and sketchy unfinished lines",
          ]}
        />
        <div className="grid grid-cols-2 gap-6">
          <AssetThumb src={SLICES[17]} label={ASSET_FILES[17]} name="Inked face" stage="cream" />
          <AssetThumb src={SLICES[22]} label={ASSET_FILES[22]} name="Limb line" stage="cream" />
        </div>
      </div>
    </Section>
  );
}

export function FacialFeatures() {
  return (
    <Section title="Facial Features">
      <Note>
        The face is Nacho&rsquo;s primary consistency anchor. The eyes, nose, and
        mouth must stay consistent across every pose.
      </Note>
      <ThumbGrid
        items={[DETAILS[0], DETAILS[1], DETAILS[5]]}
        cols="lg:grid-cols-3"
        stage="cream"
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Eyes</h4>
          <RuleList
            items={[
              "Large vertical oval eyes, thick black outlines",
              "Tall black pupils on cream-white shapes with small highlights",
              "Eyes are close together, expressive, slightly asymmetrical",
              "No dot eyes, realistic eyes, or anime eyes",
            ]}
          />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Nose</h4>
          <RuleList
            items={[
              "One single small black rounded nose",
              "Sits between and slightly below the eyes",
              "Simple oval/bean shape, may have a small highlight",
              "Never two noses, never realistic or animal-like",
            ]}
          />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Mouth</h4>
          <RuleList
            items={[
              "Solid black filled cartoon mouth, no teeth",
              "Optional orange tongue inside open mouths",
              "Bold, simple, graphic \u2014 follows the chip curve",
              "Smiles can be exaggerated; avoid thin-line mouths",
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

export function Limbs() {
  return (
    <Section title="Hands, Arms, Legs & Shoes">
      <Note>
        Nacho uses classic rubber-hose cartoon limbs. Show both arms whenever
        possible &mdash; hands should never float without arms, and full-body
        poses must show both legs and shoes.
      </Note>
      <ThumbGrid
        items={[DETAILS[2], DETAILS[3], { ...POSE11 }]}
        cols="lg:grid-cols-3"
        stage="cream"
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Arms &amp; gloves</h4>
          <RuleList
            items={[
              "Black rubber-hose tubes attached to both sides of the chip",
              "Arms curve naturally and stay connected \u2014 never broken",
              "Oversized puffy white gloves with simple finger divisions",
              "Warm off-white fill, thick outline, slight stippled shading",
              "Avoid human hand anatomy and thin fingers",
            ]}
          />
        </div>
        <div className="rounded-sm border-2 border-foreground bg-background p-5 shadow-sm">
          <h4 className="mb-3 text-lg font-bold">Legs &amp; shoes</h4>
          <RuleList
            items={[
              "Black rubber-hose legs under the chip body",
              "Two vertical or curved black forms, visible in full-body poses",
              "Oversized white vintage shoes with rounded toe boxes",
              "Warm cream shading, thick outline, simple sole detail",
              "In jumping/dipping poses, both shoes must stay visible",
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

const POSE11 = {
  n: 11,
  src: SLICES[11],
  label: ASSET_FILES[11],
  name: "Full-body limbs",
  blurb: "Both arms, both legs, and both shoes visible on the neutral stand.",
};
