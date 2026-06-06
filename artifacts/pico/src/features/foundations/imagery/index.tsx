import { PageHeader } from "@/components/docs/shared";
import {
  Overview,
  Proportions,
  ShapeLanguage,
  LineQuality,
  FacialFeatures,
  Limbs,
} from "./anatomy";
import { ColorPalette, TextureSystem } from "./system";
import { ExpressionLibrary, PoseLibrary, AssetReferenceTable } from "./library";
import {
  UsageGuidelines,
  SizeCropping,
  AIPrompts,
  DoDontSection,
} from "./prompts";
import { MasterPrompt } from "./master";

export default function Imagery() {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="FOUNDATIONS"
        title="Character Prompt Spec"
        intro={
          <>
            Nacho is the anthropomorphic nacho-chip mascot used across the brand
            system &mdash; a vintage 1930s rubber-hose cartoon character adapted
            for a modern product brand: expressive, warm, slightly mischievous,
            and highly recognizable. This page documents the existing character
            system, visual rules, reusable poses, textures, proportions, and
            asset usage. It does not redesign the mascot.
          </>
        }
      />

      <Overview />
      <Proportions />
      <ShapeLanguage />
      <ColorPalette />
      <LineQuality />
      <TextureSystem />
      <FacialFeatures />
      <Limbs />
      <ExpressionLibrary />
      <PoseLibrary />
      <UsageGuidelines />
      <SizeCropping />
      <AIPrompts />
      <MasterPrompt />
      <AssetReferenceTable />
      <DoDontSection />
    </div>
  );
}
