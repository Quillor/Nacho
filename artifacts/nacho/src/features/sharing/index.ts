// Sharing feature: the reusable VideoPlayer (used by the editor and public view)
// and the public, unauthenticated shared-recording page.
export {
  VideoPlayer,
  CHAPTER_LABEL_MAX_CHARS,
  type VideoPlayerHandle,
  type VideoPlayerProps,
} from "./components/video-player";
export { PublicView } from "./components/public-view";
