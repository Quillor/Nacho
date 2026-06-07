import { useEffect, useRef } from "react";
import { OverlayShell, DRAG_REGION } from "./overlay-shell";

// Presenter-only camera preview (content-protected). This is separate from the
// camera bubble the recorder composites into the screen recording — it lets the
// presenter see themselves without that preview appearing in the output. The
// ring uses --color-card to match the recorded bubble.
export function CameraOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <OverlayShell className="p-2">
      <div
        style={{ ...DRAG_REGION, borderColor: "var(--color-card)" }}
        className="h-full w-full overflow-hidden rounded-full border-4 shadow-md"
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    </OverlayShell>
  );
}
