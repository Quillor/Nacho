// Shared recording domain primitives.
//
// These describe the published-recording data model and are used by more than
// one package: the Nacho app's local-first model (artifacts/nacho) and the DB
// schema (@workspace/db). They live here so the two stay in lockstep instead of
// being re-declared (and drifting) in each place.
//
// NOTE: the generated API types in @workspace/api-zod describe the same concepts
// for the wire format and are produced by codegen from the OpenAPI spec — do not
// hand-edit those; this file is the source of truth for the hand-written model.

/** A chapter marker shown on the timeline. */
export interface Chapter {
  time: number;
  label: string;
}

/** A single timestamped transcript line. */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

/** Whether a recording has a resolvable public share link. */
export type Visibility = "private" | "public";

/** Which corner the camera bubble (selfie) sits in for a screen+cam recording. */
export type SelfieCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
