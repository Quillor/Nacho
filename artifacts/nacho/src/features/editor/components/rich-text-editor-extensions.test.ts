// @vitest-environment jsdom
// Regression tests for the recording description rich-text editor's keyboard
// behavior. A real crash once occurred where creating a heading and pressing
// Enter threw "Position N out of range"; these tests instantiate a live TipTap
// (ProseMirror) editor in jsdom and drive the same flows to guard against it.
import { describe, test, beforeAll, afterEach, expect } from "vitest";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ParagraphAfterHeading,
  normalizeHtml,
} from "./rich-text-editor-extensions";

type AnyEditor = Editor;

let editor: AnyEditor | undefined;
let lastError: unknown = null;

beforeAll(() => {
  // Surface any error ProseMirror / the DOM would otherwise swallow.
  window.addEventListener("error", (e) => {
    lastError = e;
  });
});

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

function makeEditor(content = "") {
  lastError = null;
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  return new Editor({
    element: mount,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        blockquote: false,
        code: false,
        strike: false,
        horizontalRule: false,
      }),
      ParagraphAfterHeading,
    ],
    content,
  });
}

// Dispatch a real Enter keydown to the editor's DOM so the full ProseMirror
// keymap chain runs exactly as it would for a user keypress. Returns whether
// the handler threw synchronously.
function pressEnter(ed: AnyEditor): { threw: boolean; error: unknown } {
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });
  try {
    ed.view.dom.dispatchEvent(event);
    return { threw: false, error: null };
  } catch (err) {
    return { threw: true, error: err };
  }
}

function topLevelTypes(ed: AnyEditor): string[] {
  const types: string[] = [];
  ed.state.doc.forEach((node) => types.push(node.type.name));
  return types;
}

describe("rich-text editor keyboard behavior", () => {
  for (const level of [1, 2, 3] as const) {
    test(`H${level} + text, then Enter starts a new paragraph (no crash)`, () => {
      editor = makeEditor();
      editor
        .chain()
        .focus()
        .toggleHeading({ level })
        .insertContent("Title text")
        .run();

      expect(editor.state.selection.$head.parent.type.name).toBe("heading");

      const { threw, error } = pressEnter(editor);
      expect(threw, `Enter threw: ${String(error)}`).toBe(false);
      expect(lastError, "no async ProseMirror error should fire").toBe(null);

      // Cursor must land on a fresh, empty paragraph after the heading.
      const parent = editor.state.selection.$head.parent;
      expect(parent.type.name).toBe("paragraph");
      expect(parent.content.size).toBe(0);

      expect(topLevelTypes(editor)).toEqual(["heading", "paragraph"]);

      // Typing into the new line should produce a paragraph, not a heading.
      editor.chain().focus().insertContent("Body").run();
      expect(editor.state.selection.$head.parent.type.name).toBe("paragraph");
    });
  }

  test("Enter in the middle of a heading splits it into two headings", () => {
    editor = makeEditor();
    editor
      .chain()
      .focus()
      .toggleHeading({ level: 2 })
      .insertContent("HelloWorld")
      .run();

    // Move the cursor to the middle (after "Hello").
    editor.commands.setTextSelection(1 + 5);
    expect(editor.state.selection.$head.parentOffset).toBe(5);

    const { threw, error } = pressEnter(editor);
    expect(threw, `Enter threw: ${String(error)}`).toBe(false);
    expect(lastError).toBe(null);

    expect(topLevelTypes(editor)).toEqual(["heading", "heading"]);
  });

  test("bold toggles a strong mark on selected text", () => {
    editor = makeEditor();
    editor.chain().focus().insertContent("hello").run();
    editor.commands.selectAll();
    editor.chain().focus().toggleBold().run();
    expect(editor.isActive("bold")).toBe(true);
    expect(editor.getHTML()).toMatch(/<strong>hello<\/strong>/);
  });

  test("italic toggles an em mark on selected text", () => {
    editor = makeEditor();
    editor.chain().focus().insertContent("hello").run();
    editor.commands.selectAll();
    editor.chain().focus().toggleItalic().run();
    expect(editor.isActive("italic")).toBe(true);
    expect(editor.getHTML()).toMatch(/<em>hello<\/em>/);
  });

  test("bullet list wraps the paragraph in a ul > li", () => {
    editor = makeEditor();
    editor.chain().focus().insertContent("item").run();
    editor.chain().focus().toggleBulletList().run();
    expect(editor.isActive("bulletList")).toBe(true);
    expect(editor.getHTML()).toMatch(/<ul>\s*<li>/);
  });

  test("numbered list wraps the paragraph in an ol > li", () => {
    editor = makeEditor();
    editor.chain().focus().insertContent("item").run();
    editor.chain().focus().toggleOrderedList().run();
    expect(editor.isActive("orderedList")).toBe(true);
    expect(editor.getHTML()).toMatch(/<ol>\s*<li>/);
  });

  test("Enter inside a list item keeps the list (does not crash)", () => {
    editor = makeEditor();
    editor.chain().focus().insertContent("first").toggleBulletList().run();
    const { threw, error } = pressEnter(editor);
    expect(threw, `Enter threw: ${String(error)}`).toBe(false);
    expect(lastError).toBe(null);
    expect(editor.isActive("bulletList")).toBe(true);
  });

  test("normalizeHtml treats an empty doc as an empty string", () => {
    expect(normalizeHtml("<p></p>")).toBe("");
    expect(normalizeHtml("   ")).toBe("");
    expect(normalizeHtml("<p>hi</p>")).toBe("<p>hi</p>");
  });
});
