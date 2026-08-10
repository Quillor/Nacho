import { useEffect, useState } from "react";
import { Monitor, AppWindow, RefreshCw } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { cn } from "@/lib/utils";
import { desktopBridge, type CaptureSource } from "@/lib/desktop";

type Tab = "screen" | "window";

/**
 * Zoom-style in-app share picker for the desktop app: tabs for entire screens
 * vs individual app windows, a live-thumbnail grid, and a Share confirm — no
 * OS picker involved. The chosen source id is handed to the Electron main
 * process, which resolves the next getDisplayMedia call to it.
 */
export function SourcePicker({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (sourceId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("screen");
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const bridge = desktopBridge?.capture;
    if (!bridge) return;
    setLoading(true);
    try {
      setSources(await bridge.listSources());
    } catch {
      /* keep the previous list */
    } finally {
      setLoading(false);
    }
  };

  // Load on open and keep window thumbnails reasonably fresh while visible.
  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setTab("screen");
    void refresh();
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const visible = sources.filter((s) => s.kind === tab);
  const tabBtn = (id: Tab, label: string, Icon: typeof Monitor) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={cn(
        "flex items-center gap-2 border-2 border-foreground px-4 py-2 font-bold",
        tab === id
          ? "bg-accent text-accent-foreground"
          : "bg-background hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose what to share"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-6"
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col border-2 border-foreground bg-background shadow-md">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="font-display text-xl font-extrabold">
            Choose what to share
          </h2>
          <button
            type="button"
            aria-label="Refresh sources"
            onClick={() => void refresh()}
            className="flex h-9 w-9 items-center justify-center border border-foreground bg-card hover:bg-muted"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        <div role="tablist" className="flex gap-2 px-5 pt-4">
          {tabBtn("screen", "Screens", Monitor)}
          {tabBtn("window", "Windows", AppWindow)}
        </div>

        <div className="min-h-48 flex-1 overflow-y-auto p-5">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-muted-foreground">
              {loading ? "Looking for sources…" : "Nothing to share here."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {visible.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  onDoubleClick={() => onConfirm(s.id)}
                  aria-pressed={selected === s.id}
                  className={cn(
                    "flex flex-col border-2 text-left transition-colors",
                    selected === s.id
                      ? "border-foreground ring-2 ring-accent ring-offset-2"
                      : "border-foreground/40 hover:border-foreground",
                  )}
                >
                  <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-muted">
                    {s.thumbnailDataUrl ? (
                      <img
                        src={s.thumbnailDataUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Monitor className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <span className="flex items-center gap-2 truncate border-t border-foreground/40 px-2 py-1.5 text-xs font-bold">
                    {s.appIconDataUrl && (
                      <img src={s.appIconDataUrl} alt="" className="h-4 w-4" />
                    )}
                    <span className="truncate">{s.name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-foreground px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">
            Sharing a window records just that app. The enlarged-cursor overlay
            works only for full screens.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-2 border-foreground font-bold"
            >
              Cancel
            </Button>
            <Button
              disabled={!selected}
              onClick={() => selected && onConfirm(selected)}
              className="border-2 border-foreground bg-accent font-bold text-accent-foreground"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
