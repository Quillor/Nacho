import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";

import { VideosCard } from "./videos-card";
import { AboutCard } from "./about-card";
import { EmailCard } from "./email-card";
import { DangerZoneCard } from "./danger-zone-card";
import type { LocalRecordingMeta } from "@/lib/types";

// --- Module mocks ---------------------------------------------------------

vi.mock("@/lib/db", () => ({
  listRecordings: vi.fn(),
  deleteRecording: vi.fn(),
}));

vi.mock("@workspace/api-client-react", () => ({
  useGetVersion: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useUser: vi.fn(),
  useClerk: vi.fn(),
}));

vi.mock("@workspace/pico-ui/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { listRecordings } from "@/lib/db";
import { useGetVersion } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";

// --- Helpers --------------------------------------------------------------

/** A promise whose resolution we control, to hold a card in its loading state. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Count the Pico Skeleton placeholders currently rendered in a subtree. */
function skeletonCount(container: HTMLElement): number {
  return container.querySelectorAll('[data-pico-component="Skeleton"]').length;
}

const fakeUser = {
  primaryEmailAddress: { emailAddress: "dev-user@nacho.test" },
  unsafeMetadata: { displayName: "Dev User" },
  fullName: "Dev User",
  firstName: "Dev",
};

beforeEach(() => {
  vi.mocked(useClerk).mockReturnValue({ signOut: vi.fn() } as never);
  vi.mocked(useUser).mockReturnValue({
    user: fakeUser,
    isLoaded: true,
  } as never);
  vi.mocked(useGetVersion).mockReturnValue({ data: undefined } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

// --- Tests ----------------------------------------------------------------

describe("Settings loading skeletons", () => {
  it("VideosCard shows skeletons for Recordings/Published/Disk used, then real values", async () => {
    const recs = deferred<LocalRecordingMeta[]>();
    const usage = deferred<StorageEstimate>();
    vi.mocked(listRecordings).mockReturnValue(recs.promise);
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { estimate: () => usage.promise },
    });

    const { container } = render(<VideosCard />);

    // Three values are still loading: Recordings, Published, Disk used.
    expect(skeletonCount(container)).toBe(3);

    await act(async () => {
      recs.resolve([
        { id: "a", shareId: "share-a" } as LocalRecordingMeta,
        { id: "b" } as LocalRecordingMeta,
      ]);
      await recs.promise;
    });
    await act(async () => {
      usage.resolve({ usage: 2 * 1024 * 1024 } as StorageEstimate);
      await usage.promise;
    });

    // Skeletons are replaced by the resolved values.
    expect(skeletonCount(container)).toBe(0);
    const recordingsRow = screen.getByText("Recordings").closest("div")!;
    expect(within(recordingsRow).getByText("2")).toBeInTheDocument();
    const publishedRow = screen.getByText("Published").closest("div")!;
    expect(within(publishedRow).getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
  });

  it("AboutCard shows skeletons for Version/Released, then real values", () => {
    const { container, rerender } = render(<AboutCard />);
    expect(skeletonCount(container)).toBe(2);

    vi.mocked(useGetVersion).mockReturnValue({
      data: { version: "1.4.2", releaseDate: "Jun 8, 2026" },
    } as never);
    rerender(<AboutCard />);

    expect(skeletonCount(container)).toBe(0);
    expect(screen.getByText("1.4.2")).toBeInTheDocument();
    expect(screen.getByText("Jun 8, 2026")).toBeInTheDocument();
  });

  it("EmailCard shows a skeleton for the current email until the user resolves", () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoaded: false,
    } as never);
    const { container, rerender } = render(<EmailCard />);
    expect(skeletonCount(container)).toBe(1);

    vi.mocked(useUser).mockReturnValue({
      user: fakeUser,
      isLoaded: true,
    } as never);
    rerender(<EmailCard />);

    expect(skeletonCount(container)).toBe(0);
    expect(screen.getByText("dev-user@nacho.test")).toBeInTheDocument();
  });

  it("DangerZoneCard shows a skeleton for 'Signed in as' until the user resolves", () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoaded: false,
    } as never);
    const { container, rerender } = render(<DangerZoneCard />);
    expect(skeletonCount(container)).toBe(1);

    vi.mocked(useUser).mockReturnValue({
      user: fakeUser,
      isLoaded: true,
    } as never);
    rerender(<DangerZoneCard />);

    expect(skeletonCount(container)).toBe(0);
    expect(screen.getByText("Dev User")).toBeInTheDocument();
  });
});

describe("Settings danger-zone severity treatment", () => {
  it("'Delete my account' uses a stronger destructive treatment than 'Clear local recordings'", async () => {
    // Danger zone: the destructive Pico Button variant + a "Permanent" badge.
    const danger = render(<DangerZoneCard />);
    const deleteBtn = danger.getByRole("button", {
      name: /delete my account/i,
    });
    // A non-hover (always-on) filled destructive background.
    const filledDestructive = /(^|\s)bg-destructive(\s|$)/;
    expect(deleteBtn).toHaveAttribute("data-pico-variant", "destructive");
    expect(deleteBtn.className).toMatch(filledDestructive);
    expect(deleteBtn.className).toContain("border-destructive");
    // The card itself is badged as permanent — the strongest severity signal.
    expect(danger.getByText("Permanent")).toBeInTheDocument();
    danger.unmount();

    // Videos card: a lower-emphasis "outline" destructive-tinted action.
    const recs = deferred<LocalRecordingMeta[]>();
    vi.mocked(listRecordings).mockReturnValue(recs.promise);
    const videos = render(<VideosCard />);
    await act(async () => {
      recs.resolve([{ id: "a" } as LocalRecordingMeta]);
      await recs.promise;
    });
    const clearBtn = videos.getByRole("button", {
      name: /clear local recordings/i,
    });

    // The clear action is visibly distinct and weaker: outline variant, no
    // filled destructive background.
    expect(clearBtn).toHaveAttribute("data-pico-variant", "outline");
    expect(clearBtn.className).not.toMatch(filledDestructive);
    expect(deleteBtn.getAttribute("data-pico-variant")).not.toBe(
      clearBtn.getAttribute("data-pico-variant"),
    );
  });
});
