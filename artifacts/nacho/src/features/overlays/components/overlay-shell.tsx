import { useEffect } from "react";
import { cn } from "@/lib/utils";

// Shared wrapper for the presenter overlay routes. These render in their own
// frameless, transparent Electron windows, so the document background must be
// cleared (index.css paints it opaque for the main app). Each overlay supplies
// its own card/background.
export function OverlayShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { html: html.style.background, body: body.style.background };
    html.style.background = "transparent";
    body.style.background = "transparent";
    return () => {
      html.style.background = prev.html;
      body.style.background = prev.body;
    };
  }, []);

  return (
    <div className={cn("h-screen w-screen overflow-hidden", className)}>
      {children}
    </div>
  );
}

// Frameless windows are moved by dragging regions marked app-region: drag.
// Interactive children must opt back out with no-drag. (Not in CSSProperties.)
export const DRAG_REGION = {
  WebkitAppRegion: "drag",
} as unknown as React.CSSProperties;
export const NO_DRAG_REGION = {
  WebkitAppRegion: "no-drag",
} as unknown as React.CSSProperties;
