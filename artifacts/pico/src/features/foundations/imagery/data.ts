/** Public folder where the high-res Nacho assets are served from. */
export const NACHO_DIR = `${import.meta.env.BASE_URL}nacho/`;

/** Number -> human-readable, high-resolution asset file name. */
export const ASSET_FILES: Record<number, string> = {
  1: "nacho-presenting.webp",
  2: "nacho-thumbs-up.webp",
  3: "nacho-dipping-queso.webp",
  4: "nacho-pointing.webp",
  5: "nacho-checklist.webp",
  6: "nacho-sad.webp",
  7: "nacho-jumping.webp",
  8: "nacho-running.webp",
  9: "nacho-walking.webp",
  10: "nacho-hero-pose.webp",
  11: "nacho-neutral-stand.webp",
  12: "nacho-detail-eyes-nose.webp",
  13: "nacho-detail-mouth.webp",
  14: "nacho-detail-glove.webp",
  15: "nacho-detail-shoe.webp",
  16: "nacho-detail-chip-edge.webp",
  17: "nacho-face.webp",
  18: "nacho-proportions.webp",
  19: "texture-chip-speckles.webp",
  20: "texture-toasted-edge.webp",
  21: "texture-halftone-shading.webp",
  22: "texture-rubber-hose-limb.webp",
  23: "texture-ground-shadow.webp",
  24: "texture-paper-grain.webp",
};

/** Absolute (base-prefixed) URL for each asset. */
export const SLICES: Record<number, string> = Object.fromEntries(
  Object.entries(ASSET_FILES).map(([n, f]) => [Number(n), NACHO_DIR + f]),
) as Record<number, string>;

export interface Thumb {
  n: number;
  src: string;
  label: string;
  name: string;
  blurb: string;
}

function thumb(n: number, name: string, blurb: string): Thumb {
  return { n, src: SLICES[n], label: ASSET_FILES[n], name, blurb };
}

export const POSES: Thumb[] = [
  thumb(1, "Speaking / Presenting", "Faces forward with one arm extended in a friendly presenting gesture. Use for intros, callouts, tips, and educational content."),
  thumb(2, "Thumbs Up", "A large, confident thumbs-up with a happy expression. Use for success, approval, completion, and positive confirmation."),
  thumb(3, "Dipping / Queso Jump", "Jumps feet-first into a bowl of queso, arms raised, both shoes visible above the splash. The canonical dipping pose."),
  thumb(4, "Pointing", "Points to the side with a helpful expression. Use for directional guidance, feature highlights, and UI callouts."),
  thumb(5, "Checklist", "Holds a checklist board with simple checkmarks. Use for tasks, setup steps, onboarding, and completion lists."),
  thumb(6, "Sad", "Disappointed, with droopy eyes and a small frown. Use for empty states, no results, and soft error states."),
  thumb(7, "Jumping", "Airborne with both hands raised and both shoes visible. Use for celebration and energetic transitions."),
  thumb(8, "Running", "Rubber-hose run, one leg forward, one back, arms pumping. Use for speed, momentum, and progress."),
  thumb(9, "Walking", "Walks with one foot forward and arms swinging. Use for onboarding journeys and step-by-step flows."),
  thumb(10, "Hero Pose", "Stands confidently with one finger raised. Use for tips, recommendations, and \u201Cpro tip\u201D moments."),
  thumb(11, "Neutral Stand", "Stands neutrally with a relaxed smile. The canonical baseline mascot pose for identity and overview."),
];

export const DETAILS: Thumb[] = [
  thumb(12, "Eyes & Nose", "Close-up reference for the eyes and nose placement."),
  thumb(13, "Mouth", "Close-up reference for the bold black mouth style."),
  thumb(14, "Glove", "Close-up reference for the oversized white cartoon glove."),
  thumb(15, "Shoe", "Close-up reference for the oversized vintage cartoon shoe."),
  thumb(16, "Chip Edge", "Close-up reference for the scalloped, toasted chip edge."),
  thumb(17, "Face / Head", "Primary close-up identity reference: chip body, eyes, nose, mouth, expression."),
  thumb(18, "Proportions", "Measured width-to-height reference. The canonical proportion guide."),
];

export const TEXTURES: Thumb[] = [
  thumb(19, "Chip Speckles", "Small brown tortilla dots scattered across the chip body \u2014 irregular spacing, varying size."),
  thumb(20, "Toasted Edge", "Orange-brown edge with darker speckles, giving the chip baked depth."),
  thumb(21, "Halftone Shading", "Dot-based vintage print shading used in shadows and warm gradients."),
  thumb(22, "Rubber-Hose Limb", "Light grain across the black limbs so arms and legs never feel flat."),
  thumb(23, "Ground Shadow", "Stippled black/brown shadow under the feet that keeps the character grounded."),
  thumb(24, "Paper Grain", "Subtle cream paper grain for backgrounds, cards, and documentation."),
];

export interface Swatch {
  name: string;
  hex: string;
  usage: string;
  light?: boolean;
}

export const PALETTE: Swatch[] = [
  { name: "Chip Fill", hex: "#F4C51A", usage: "Main yellow tortilla chip body." },
  { name: "Chip Highlight", hex: "#FFE36A", usage: "Warm highlight on raised chip areas and subtle surface variation.", light: true },
  { name: "Toasted Edge", hex: "#C96A14", usage: "Orange toasted side edge and deeper baked areas." },
  { name: "Deep Toast Shadow", hex: "#8A3F0B", usage: "Dark toasted speckles, edge shadows, and warm depth." },
  { name: "Ink / Limb Black", hex: "#11100D", usage: "Primary outline, arms, legs, pupils, and strong facial details." },
  { name: "Mouth Interior", hex: "#0B0907", usage: "Solid black filled mouth shape." },
  { name: "Tongue Orange", hex: "#D96728", usage: "Simple warm orange tongue inside open mouths." },
  { name: "Glove White", hex: "#FFF8E8", usage: "White gloves with a warm vintage tone.", light: true },
  { name: "Shoe White", hex: "#F7F0DD", usage: "White shoes with subtle cream shading.", light: true },
  { name: "Shadow Brown", hex: "#2E1C0F", usage: "Ground shadows and low-opacity stippled shadows." },
  { name: "Halftone Grain Brown", hex: "#6B3A13", usage: "Printed texture, halftone shadows, and warm stipple." },
  { name: "Background Cream", hex: "#FFF8DC", usage: "Preferred documentation and illustration background.", light: true },
];

export interface Expression {
  name: string;
  desc: string;
  usage: string;
  src?: string;
}

export const EXPRESSIONS: Expression[] = [
  { name: "Cheerful", desc: "Open black-filled smile, raised brows, friendly eyes.", usage: "Default mascot expression for guidance and brand moments.", src: SLICES[17] },
  { name: "Excited", desc: "Wide eyes, open smile, energetic posture.", usage: "Success states, celebration, launches, positive feedback.", src: SLICES[7] },
  { name: "Sad", desc: "Droopy eyes, raised inner brows, downturned mouth, slumped posture.", usage: "Empty states, errors, soft failure, \u201Cnothing here yet\u201D.", src: SLICES[6] },
  { name: "Confident", desc: "Slight smirk, one brow raised, strong stance.", usage: "Tips, shortcuts, feature education, product confidence.", src: SLICES[10] },
  { name: "Determined", desc: "Angled brows, focused eyes, tighter mouth.", usage: "Progress, action, productivity, challenge states.", src: SLICES[8] },
];

export interface AssetRow {
  n: number;
  type: string;
  description: string;
  usage: string;
}

export const ASSET_TABLE: AssetRow[] = [
  { n: 1, type: "Pose", description: "Speaking / presenting gesture", usage: "Tips, intros, education, product guidance" },
  { n: 2, type: "Pose", description: "Thumbs-up", usage: "Success, confirmation, approval" },
  { n: 3, type: "Pose", description: "Dipping / queso jump", usage: "Brand moments, playful loading, food-themed celebration" },
  { n: 4, type: "Pose", description: "Pointing", usage: "Callouts, annotations, feature highlights" },
  { n: 5, type: "Pose", description: "Checklist", usage: "Tasks, onboarding, setup, QA" },
  { n: 6, type: "Pose / Expression", description: "Sad / disappointed", usage: "Empty states, no results, soft errors" },
  { n: 7, type: "Pose", description: "Jumping", usage: "Celebration, energy, motion" },
  { n: 8, type: "Pose", description: "Running", usage: "Speed, progress, momentum" },
  { n: 9, type: "Pose", description: "Walking", usage: "Journeys, onboarding, step-by-step flows" },
  { n: 10, type: "Pose", description: "Hero / tip pose", usage: "Pro tips, recommendations, guidance" },
  { n: 11, type: "Pose", description: "Neutral stand", usage: "Default reference, identity, baseline" },
  { n: 12, type: "Detail", description: "Eyes and nose placement", usage: "Facial consistency reference" },
  { n: 13, type: "Detail", description: "Mouth", usage: "Mouth style reference" },
  { n: 14, type: "Detail", description: "Glove", usage: "Hand and glove reference" },
  { n: 15, type: "Detail", description: "Shoe", usage: "Footwear and leg reference" },
  { n: 16, type: "Detail", description: "Chip edge", usage: "Shape and edge reference" },
  { n: 17, type: "Detail", description: "Face and chip body", usage: "Primary close-up identity reference" },
  { n: 18, type: "Detail", description: "Proportions", usage: "Width/height and body scale reference" },
  { n: 19, type: "Texture", description: "Chip speckles", usage: "Tortilla surface texture" },
  { n: 20, type: "Texture", description: "Toasted edge texture", usage: "Edge depth and baked detail" },
  { n: 21, type: "Texture", description: "Halftone shading", usage: "Vintage print shadows" },
  { n: 22, type: "Texture", description: "Rubber-hose limb texture", usage: "Arm and leg rendering reference" },
  { n: 23, type: "Texture", description: "Stippled ground shadow", usage: "Grounding character illustrations" },
  { n: 24, type: "Texture", description: "Paper grain", usage: "Background and print texture reference" },
];

export const PERSONALITY = [
  "Helpful", "Energetic", "Playful", "Friendly", "Slightly mischievous",
  "Optimistic", "Expressive", "Vintage-inspired", "Simple & readable",
];

export const NOT_PERSONALITY = [
  "Mean", "Aggressive", "Realistic food", "A 3D mascot", "A taco",
  "A bag mascot", "A human child", "A flat corporate illustration",
  "A generic emoji character",
];
