export const BASE_PROMPT = `Create an illustration of Nacho, an anthropomorphic nacho chip mascot in a vintage 1930s rubber-hose cartoon style. Nacho has a rounded triangular tortilla chip body with puffy uneven scalloped edges, warm yellow chip texture, toasted orange-brown side edge, small brown tortilla speckles, thick black hand-inked outlines, black rubber-hose arms and legs, oversized warm white cartoon gloves, oversized warm white vintage shoes, large vertical oval eyes with black pupils and white highlights, one single small rounded black nose, and a solid black filled smiling mouth with optional orange tongue and no teeth. Use subtle halftone shading, grainy paper texture, and warm vintage print texture. Keep the character playful, friendly, helpful, expressive, and consistent with the Nacho mascot system.`;

export interface PoseAddition {
  label: string;
  text: string;
}

export const POSE_ADDITIONS: PoseAddition[] = [
  { label: "Presenting", text: "Nacho stands beside a simplified UI card, gesturing toward it with one visible arm while the other arm remains visible." },
  { label: "Pointing", text: "Nacho points to the side with a clearly attached rubber-hose arm and oversized white glove." },
  { label: "Checklist", text: "Nacho holds a simple checklist board with checkmarks and unreadable lines." },
  { label: "Dipping", text: "Nacho jumps feet-first into a bowl of yellow queso. Both arms are raised and visible, both gloves are visible, both black legs are visible, and both oversized white shoes are clearly visible above the sauce splash." },
  { label: "Sad states", text: "Nacho has droopy eyes, raised inner brows, a small curved frown, and a slumped but readable posture." },
  { label: "Celebration", text: "Nacho has both arms raised, both shoes visible, an open black-filled smile, and small sauce or confetti accents." },
];

export const NEGATIVE_PROMPT = `Do not generate missing arms, missing legs, hidden shoes, floating gloves, disconnected hands, two noses, duplicate noses, teeth, tooth rows, white teeth shapes, incorrect mouth shape, realistic tortilla chip, 3D mascot, clay render, plush toy, anime style, pixel art, modern flat vector, glossy gradients, photorealism, overly detailed background, realistic human anatomy, sharp triangle corners, thin outlines, clean corporate illustration, inconsistent eyes, taco shape, Dorito bag mascot, corn chip logo, human-child proportions, or unreadable facial features.`;

export const AI_CONSISTENCY = [
  "Always show both arms unless intentionally hidden by a clear object",
  "Always show both legs and shoes in full-body poses",
  "Use one single nose only",
  "Use solid black mouth fill",
  "Do not add teeth",
  "Maintain eye proportions and chip width-to-height ratio",
  "Maintain the toasted side edge and tortilla speckles",
  "Maintain thick black outlines and rubber-hose limbs",
  "Maintain the warm vintage palette and oversized gloves and shoes",
];

export const USAGE_GOOD = [
  "Empty states",
  "Product onboarding",
  "Feature education",
  "Celebration moments",
  "Social media graphics",
  "Marketing illustrations",
  "Video player scenes",
  "Dashboard explainers",
  "Error states with light humor",
  "Setup checklists",
  "Product tips",
  "Campaign visuals",
];

export const USAGE_AVOID = [
  "In dense data tables",
  "In serious legal or financial warnings",
  "In high-risk destructive actions",
  "As a replacement for clear UI copy",
  "Too many times on a single screen",
  "As a tiny decorative element where details are lost",
  "In styles that conflict with the mascot system",
];

export const PLACEMENT_RULES = [
  "Give Nacho enough whitespace",
  "Don't crop off important limbs unless intentionally composed",
  "Avoid placing Nacho over visually busy backgrounds",
  "Use cream or warm neutral backgrounds when possible",
  "Keep contrast high enough for black outlines to stay crisp",
  "Don't place Nacho on colors that clash with the yellow chip body",
];

export const SIZE_RECOMMENDED = [
  "Large hero illustrations",
  "Medium empty-state illustrations",
  "Small UI accents only when simplified or cropped intentionally",
  "Documentation thumbnails",
  "Marketing cards",
];

export const CROP_RULES = [
  "Do not crop off the face",
  "Do not crop off both hands",
  "Do not crop off both feet",
  "Do not crop so tightly the chip shape is unclear",
  "For action poses, preserve motion lines, shoes, and gloves",
  "For the dipping pose, preserve the full bowl, splash, feet, arms, and face",
];

export const DO_RULES = [
  "Use the provided Nacho assets as the canonical reference",
  "Keep the rounded triangular chip body",
  "Preserve the single black nose",
  "Use solid black mouth shapes with no teeth",
  "Show both arms and both legs in full-body poses",
  "Keep both shoes visible in jumping and dipping poses",
  "Use warm yellow chip colors",
  "Preserve tortilla speckles and thick black outlines",
  "Use subtle halftone and paper grain",
];

export const DONT_RULES = [
  "Remove arms or legs, or create floating gloves",
  "Add a second nose or any teeth",
  "Hide both feet in sauce splashes",
  "Make Nacho realistic or 3D",
  "Turn Nacho into a taco or bag mascot",
  "Use thin vector lines or clean corporate strokes",
  "Make the chip a perfect triangle",
  "Remove texture",
  "Use cold or neon colors",
  "Overuse Nacho in dense UI screens",
];
