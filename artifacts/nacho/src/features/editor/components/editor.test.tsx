import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { LocalRecording } from "@/lib/types";

// --- Mock the IO / heavy-leaf layer so the *real* editor logic (dirty
// detection, the Save button's clean/dirty states, the "Leave without saving?"
// dialog) runs in jsdom without IndexedDB, video, canvas, or Clerk. ---

const recordingStore = new Map<string, LocalRecording>();

vi.mock("@/lib/db", () => ({
  getRecording: vi.fn(async (id: string) => recordingStore.get(id) ?? null),
  // Mirror the real updateRecording: merge the patch, persist, return the
  // updated record so the editor can re-read itself as "clean" after a save.
  updateRecording: vi.fn(async (id: string, patch: Partial<LocalRecording>) => {
    const existing = recordingStore.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    recordingStore.set(id, updated);
    return updated;
  }),
}));

// The background-upload phase the PublishPanel reads. Mutable so individual
// tests can drive the "uploading/uploaded/failed" branches; reset in beforeEach.
let uploadState: { phase: string; progress: number } = {
  phase: "idle",
  progress: 0,
};

vi.mock("@/features/publishing", () => ({
  useUploadState: () => uploadState,
  startBackgroundUpload: vi.fn(),
  getPublicLink: vi.fn(),
  unpublishRecording: vi.fn(),
  syncPublishedRecording: vi.fn(),
  waitForUpload: vi.fn(),
  isUploadInFlight: vi.fn(() => false),
  retryUpload: vi.fn(),
  createGifFromBlob: vi.fn(),
}));

// Capture the success/error toasts the publish flows raise so tests can assert
// the surfaced outcome without mounting a <Toaster>.
const toastMock = vi.fn();
vi.mock("@workspace/pico-ui/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/media", () => ({
  extractFilmstrip: vi.fn(async () => []),
}));

// Mount-only stand-ins for pieces that need real browser media / rich-text.
vi.mock("@/features/sharing", () => ({
  VideoPlayer: () => <div data-testid="video-player" />,
  CHAPTER_LABEL_MAX_CHARS: 60,
}));

vi.mock("../components/rich-text-editor", () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

// AppShell pulls in Clerk + nav; the editor body is what we're testing.
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Editor } from "./editor";
import {
  getPublicLink,
  syncPublishedRecording,
  retryUpload,
} from "@/features/publishing";
import { shareUrl } from "@/lib/api";

function makeRecording(overrides: Partial<LocalRecording> = {}): LocalRecording {
  return {
    id: "rec-1",
    title: "Original title",
    description: "Original description",
    durationSec: 30,
    trimStart: 0,
    trimEnd: 30,
    hasAudio: true,
    source: "screen",
    selfieCorner: null,
    captionLang: null,
    chapters: [],
    displayChaptersOnVideo: false,
    notifyOnView: false,
    pinned: false,
    transcript: [],
    createdAt: Date.now(),
    blob: new Blob(["x"], { type: "video/webm" }),
    thumbnail: null,
    mimeType: "video/webm",
    visibility: "private",
    shareId: null,
    videoPath: null,
    thumbnailPath: null,
    gifPath: null,
    ...overrides,
  };
}

function renderEditor(id = "rec-1") {
  const { hook, history } = memoryLocation({
    path: `/editor/${id}`,
    record: true,
  });
  const utils = render(
    <Router hook={hook}>
      <Editor />
    </Router>,
  );
  return { ...utils, history };
}

beforeEach(() => {
  recordingStore.clear();
  recordingStore.set("rec-1", makeRecording());
  uploadState = { phase: "idle", progress: 0 };
  toastMock.mockClear();
  vi.mocked(getPublicLink).mockReset();
  vi.mocked(syncPublishedRecording).mockReset();
  vi.mocked(retryUpload).mockReset();
});

describe("Editor unsaved-changes safety net", () => {
  it("toggles the Save control between clean and dirty as a field is edited and saved", async () => {
    const user = userEvent.setup();
    renderEditor();

    // Loads clean: the disabled "All changes saved" affordance, no dirty save.
    expect(
      await screen.findByRole("button", { name: /all changes saved/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save changes/i }),
    ).not.toBeInTheDocument();

    // Edit the title → the Save button flips to the active "Save changes" state.
    const titleInput = screen.getByDisplayValue("Original title");
    await user.clear(titleInput);
    await user.type(titleInput, "Edited title");

    const saveButton = await screen.findByRole("button", {
      name: /save changes/i,
    });
    expect(saveButton).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /all changes saved/i }),
    ).not.toBeInTheDocument();

    // Saving persists the edit and the control returns to "All changes saved".
    await user.click(saveButton);
    expect(
      await screen.findByRole("button", { name: /all changes saved/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save changes/i }),
    ).not.toBeInTheDocument();
  });

  it("warns before leaving to the Library with unsaved edits and keeps the user on Keep editing", async () => {
    const user = userEvent.setup();
    const { history } = renderEditor();

    const titleInput = await screen.findByDisplayValue("Original title");
    await user.type(titleInput, " changed");

    await user.click(screen.getByRole("button", { name: /library/i }));

    // The confirmation dialog appears instead of navigating away.
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/leave without saving\?/i),
    ).toBeInTheDocument();
    expect(history.length).toBe(1);

    // "Keep editing" dismisses the dialog and stays on the editor.
    await user.click(within(dialog).getByRole("button", { name: /keep editing/i }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(history.length).toBe(1);
  });

  it("navigates to the Library when Discard & leave is confirmed", async () => {
    const user = userEvent.setup();
    const { history } = renderEditor();

    const titleInput = await screen.findByDisplayValue("Original title");
    await user.type(titleInput, " changed");

    await user.click(screen.getByRole("button", { name: /library/i }));
    const dialog = await screen.findByRole("alertdialog");

    await user.click(
      within(dialog).getByRole("button", { name: /discard & leave/i }),
    );

    await waitFor(() => expect(history[history.length - 1]).toBe("/library"));
  });

  it("leaves to the Library without a prompt when there are no unsaved edits", async () => {
    const user = userEvent.setup();
    const { history } = renderEditor();

    // Wait for the recording to load (clean state).
    await screen.findByRole("button", { name: /all changes saved/i });

    await user.click(screen.getByRole("button", { name: /library/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(history[history.length - 1]).toBe("/library"));
  });
});

describe("Editor publish & share-sync flow", () => {
  it("gets a public link: flips private → public, sets the shareId, and surfaces the link", async () => {
    const user = userEvent.setup();
    vi.mocked(getPublicLink).mockResolvedValue({
      shareId: "shared-abc",
      visibility: "public",
      videoPath: "/objects/uploads/rec-1.webm",
      thumbnailPath: null,
      gifPath: "/objects/uploads/rec-1.gif",
    });
    renderEditor();

    // Starts private: the "Get public link" CTA is shown, no public link yet.
    const getLink = await screen.findByRole("button", {
      name: /get public link/i,
    });
    expect(screen.queryByText(/^public$/i)).not.toBeInTheDocument();

    await user.click(getLink);

    // The publish layer was invoked with the recording awaiting a link…
    await waitFor(() => expect(getPublicLink).toHaveBeenCalledTimes(1));

    // …and the panel transitions to the public state with the share link
    // surfaced in the read-only field.
    expect(
      await screen.findByDisplayValue(shareUrl("shared-abc")),
    ).toBeInTheDocument();
    expect(screen.getByText(/^public$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open public page/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /get public link/i }),
    ).not.toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Public link ready" }),
    );
  });

  it("re-syncs edits on an already-published recording and surfaces the synced success", async () => {
    const user = userEvent.setup();
    recordingStore.set(
      "rec-1",
      makeRecording({
        visibility: "public",
        shareId: "shared-xyz",
        videoPath: "/objects/uploads/rec-1.webm",
        gifPath: "/objects/uploads/rec-1.gif",
      }),
    );
    vi.mocked(syncPublishedRecording).mockResolvedValue({
      shareId: "shared-xyz",
      visibility: "public",
      videoPath: "/objects/uploads/rec-1.webm",
      thumbnailPath: null,
      gifPath: "/objects/uploads/rec-1.gif",
    });
    renderEditor();

    // Loads already-public (clean state, public panel visible).
    await screen.findByRole("button", { name: /all changes saved/i });
    expect(
      screen.getByDisplayValue(shareUrl("shared-xyz")),
    ).toBeInTheDocument();

    // Edit the title → save flips to the active "Save changes" state.
    const titleInput = screen.getByDisplayValue("Original title");
    await user.clear(titleInput);
    await user.type(titleInput, "Edited title");
    await user.click(
      await screen.findByRole("button", { name: /save changes/i }),
    );

    // Saving a published recording takes the re-sync path with the edited copy…
    await waitFor(() => expect(syncPublishedRecording).toHaveBeenCalledTimes(1));
    expect(syncPublishedRecording).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Edited title", shareId: "shared-xyz" }),
      expect.any(Object),
    );

    // …and the synced success is surfaced, returning the control to clean.
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Saved & synced" }),
    );
    expect(
      await screen.findByRole("button", { name: /all changes saved/i }),
    ).toBeInTheDocument();
  });

  it("shows the Retry save recovery action when the background upload failed", async () => {
    const user = userEvent.setup();
    uploadState = { phase: "failed", progress: 0 };
    renderEditor();

    // The failed-upload branch replaces "Get public link" with a single,
    // unambiguous recovery action.
    const retry = await screen.findByRole("button", { name: /retry save/i });
    expect(screen.getByText(/couldn't save to the cloud/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /get public link/i }),
    ).not.toBeInTheDocument();

    await user.click(retry);
    expect(retryUpload).toHaveBeenCalledWith("rec-1");
  });
});
