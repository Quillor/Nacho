// Publishing feature: server-sync of recordings (private save + public publish),
// background upload coordination, and GIF-preview generation. Public surface for
// the editor, library, and studio features — import from here, not the internals.
export * from "./publish";
export * from "./upload-manager";
export * from "./gif";
