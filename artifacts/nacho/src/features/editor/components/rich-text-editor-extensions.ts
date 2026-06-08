import { Extension } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";

/** TipTap (ProseMirror) emits "<p></p>" for an empty doc; treat that as empty
 * so saved descriptions stay compatible with the truthiness checks elsewhere. */
export function normalizeHtml(html: string): string {
  const stripped = html.replace(/<p><\/p>/g, "").trim();
  return stripped === "" ? "" : html;
}

/** After a heading (or any non-paragraph block), pressing Enter at the end of
 * the line starts a normal paragraph instead of continuing the heading. */
export const ParagraphAfterHeading = Extension.create({
  name: "paragraphAfterHeading",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $head, empty } = selection;
        if (!empty) return false;
        if ($head.parent.type.name !== "heading") return false;
        if ($head.parentOffset !== $head.parent.content.size) return false;
        const paragraphType = state.schema.nodes.paragraph;
        if (!paragraphType) return false;
        // Insert a fresh paragraph immediately after the heading and place the
        // cursor inside it. Done as one explicit transaction (instead of
        // chaining splitBlock + setNode, which could leave a stale selection
        // and throw "Position N out of range").
        return this.editor.commands.command(({ tr, dispatch }) => {
          const insertPos = $head.after();
          const paragraph = paragraphType.createAndFill();
          if (!paragraph) return false;
          if (dispatch) {
            tr.insert(insertPos, paragraph);
            tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
            tr.scrollIntoView();
          }
          return true;
        });
      },
    };
  },
});
