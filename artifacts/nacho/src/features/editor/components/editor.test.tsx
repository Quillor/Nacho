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

vi.mock("@/features/publishing", () => ({
  useUploadState: () => ({ phase: "idle", progress: 0 }),
  startBackgroundUpload: vi.fn(),
  getPublicLink: vi.fn(),
  unpublishRecording: vi.fn(),
  syncPublishedRecording: vi.fn(),
  waitForUpload: vi.fn(),
  isUploadInFlight: vi.fn(() => false),
  retryUpload: vi.fn(),
  createGifFromBlob: vi.fn(),
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
