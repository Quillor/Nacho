---
name: Description editor (TipTap)
description: How the recording description editor works and the storage contract it must keep.
---
The recording description editor (`artifacts/nacho/src/components/rich-text-editor.tsx`) is a TipTap/ProseMirror WYSIWYG editor, not a markdown source editor. It replaced an `execCommand`-based `contentEditable` whose `formatBlock` for headings jumped the cursor.

**Storage contract (do not break):** the editor's value in/out is sanitized **HTML**, the same format stored on the recording and rendered (DOMPurify + `prose`) in `public-view.tsx`. Keep input and output HTML so existing recordings keep rendering. Empty doc is normalized to `""` (TipTap emits `<p></p>`) so truthiness checks (`rec.description &&`) stay correct.

**Why TipTap:** input rules (`# `, `## `, `### `, `- `, `1. `, `---`, `**bold**`, `*italic*`) and cursor/undo management come for free and reliably — the whole point vs hand-rolling contentEditable.

**Quirks:**
- StarterKit is configured to disable codeBlock/blockquote/code/strike (out of scope); heading levels limited to 1–3.
- A custom `ParagraphAfterHeading` extension makes Enter at the end of a heading start a paragraph (ProseMirror default would continue the heading).
- Placeholder needs `@tiptap/extension-placeholder` + the `.ProseMirror p.is-editor-empty` CSS in `index.css`.
- Keep the editor content `class` prose tokens in sync with `public-view.tsx` so Edit/Preview/Split look identical to the public render.

**Crash gotcha ("Position N out of range"):** keep `EditorContent` mounted in every mode (toggle with CSS `hidden`), never conditionally unmount it for Preview — detaching the live ProseMirror view crashes on the next edit/mode switch. Also guard the external value-sync effect with `editor.isDestroyed` and `editor.isFocused` so a programmatic `setContent` never fights an active edit.
