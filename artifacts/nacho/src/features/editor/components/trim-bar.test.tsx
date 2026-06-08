import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrimBar } from "./trim-bar";

// The track's pixel geometry is derived from getBoundingClientRect, which jsdom
// does not lay out. Pin it to a known 100px-wide track anchored at x=0 so a
// clientX of N maps to a ratio of N/100 (and a time of (N/100) * duration).
const TRACK_WIDTH = 100;

function stubTrackGeometry() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: TRACK_WIDTH,
    bottom: 48,
    width: TRACK_WIDTH,
    height: 48,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

const DURATION = 10;

// clientX (0..100) -> time (0..DURATION)
const xToTime = (clientX: number) => (clientX / TRACK_WIDTH) * DURATION;

/**
 * Mirrors how the Editor page wires TrimBar: start/end are controlled state and
 * onScrub drives the playhead. This lets a single drag clamp against the live
 * neighbouring value, exactly as it does in the app.
 */
function Harness({
  initialStart = 0,
  initialEnd = DURATION,
  onStartSpy,
  onEndSpy,
  onScrubSpy,
}: {
  initialStart?: number;
  initialEnd?: number;
  onStartSpy?: (v: number) => void;
  onEndSpy?: (v: number) => void;
  onScrubSpy?: (v: number) => void;
}) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [current, setCurrent] = useState(0);

  return (
    <TrimBar
      duration={DURATION}
      start={start}
      end={end}
      current={current}
      onStart={(v) => {
        setStart(v);
        onStartSpy?.(v);
      }}
      onEnd={(v) => {
        setEnd(v);
        onEndSpy?.(v);
      }}
      onScrub={(v) => {
        setCurrent(v);
        onScrubSpy?.(v);
      }}
    />
  );
}

function getHandles() {
  const handles = screen.getAllByRole("slider");
  return { startHandle: handles[0], endHandle: handles[1] };
}

// The playhead marker is the only non-handle element whose left is driven by
// `current`; find it by its z-30 marker classes.
function getPlayhead(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>(".z-30");
  if (!el) throw new Error("playhead marker not found");
  return el;
}

describe("TrimBar", () => {
  beforeEach(() => {
    stubTrackGeometry();
  });

  it("drags the start handle and reports the dragged time", () => {
    const onStartSpy = vi.fn();
    render(<Harness onStartSpy={onStartSpy} />);
    const { startHandle } = getHandles();

    fireEvent.pointerDown(startHandle);
    fireEvent.pointerMove(window, { clientX: 30 });
    fireEvent.pointerUp(window);

    expect(onStartSpy).toHaveBeenCalled();
    expect(onStartSpy).toHaveBeenLastCalledWith(xToTime(30));
  });

  it("drags the end handle and reports the dragged time", () => {
    const onEndSpy = vi.fn();
    render(<Harness onEndSpy={onEndSpy} />);
    const { endHandle } = getHandles();

    fireEvent.pointerDown(endHandle);
    fireEvent.pointerMove(window, { clientX: 70 });
    fireEvent.pointerUp(window);

    expect(onEndSpy).toHaveBeenLastCalledWith(xToTime(70));
  });

  it("clamps the start handle so it stays at least 0.2s before the end", () => {
    const onStartSpy = vi.fn();
    // end is at 5s (clientX 50); dragging start past it must clamp to end - 0.2.
    render(<Harness initialEnd={5} onStartSpy={onStartSpy} />);
    const { startHandle } = getHandles();

    fireEvent.pointerDown(startHandle);
    // clientX 90 -> 9s, well past the 5s end.
    fireEvent.pointerMove(window, { clientX: 90 });
    fireEvent.pointerUp(window);

    expect(onStartSpy).toHaveBeenLastCalledWith(5 - 0.2);
  });

  it("clamps the end handle so it stays at least 0.2s after the start", () => {
    const onEndSpy = vi.fn();
    // start is at 5s (clientX 50); dragging end before it must clamp to start + 0.2.
    render(<Harness initialStart={5} onEndSpy={onEndSpy} />);
    const { endHandle } = getHandles();

    fireEvent.pointerDown(endHandle);
    // clientX 10 -> 1s, well before the 5s start.
    fireEvent.pointerMove(window, { clientX: 10 });
    fireEvent.pointerUp(window);

    expect(onEndSpy).toHaveBeenLastCalledWith(5 + 0.2);
  });

  it("scrubs the playhead when dragging the track and moves the marker", () => {
    const onScrubSpy = vi.fn();
    const { container } = render(<Harness onScrubSpy={onScrubSpy} />);
    const track = container.firstElementChild as HTMLElement;

    // pointerDown on the track itself scrubs to that position.
    fireEvent.pointerDown(track, { clientX: 40 });
    expect(onScrubSpy).toHaveBeenLastCalledWith(xToTime(40));

    // and a subsequent move keeps updating the scrub position.
    fireEvent.pointerMove(window, { clientX: 60 });
    expect(onScrubSpy).toHaveBeenLastCalledWith(xToTime(60));
    fireEvent.pointerUp(window);

    // the playhead marker reflects the latest scrub (60% of the track).
    const playhead = getPlayhead(container);
    expect(playhead.style.left).toBe("60%");
  });

  it("stops dragging after pointer-up so later moves are ignored", () => {
    const onStartSpy = vi.fn();
    render(<Harness onStartSpy={onStartSpy} />);
    const { startHandle } = getHandles();

    fireEvent.pointerDown(startHandle);
    fireEvent.pointerMove(window, { clientX: 30 });
    fireEvent.pointerUp(window);
    onStartSpy.mockClear();

    // No active drag: a stray move must not report a new start.
    fireEvent.pointerMove(window, { clientX: 10 });
    expect(onStartSpy).not.toHaveBeenCalled();
  });
});
