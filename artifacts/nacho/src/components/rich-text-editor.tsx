import { useEffect } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/** TipTap (ProseMirror) emits "<p></p>" for an empty doc; treat that as empty
 * so saved descriptions stay compatible with the truthiness checks elsewhere. */
function normalizeHtml(html: string): string {
  const stripped = html.replace(/<p><\/p>/g, "").trim();
  return stripped === "" ? "" : html;
}

/** After a heading (or any non-paragraph block), pressing Enter at the end of
 * the line starts a normal paragraph instead of continuing the heading. */
const ParagraphAfterHeading = Extension.create({
  name: "paragraphAfterHeading",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { selection } = this.editor.state;
        const { $head, empty } = selection;
        if (!empty) return false;
        if ($head.parent.type.name !== "heading") return false;
        if ($head.parentOffset !== $head.parent.content.size) return false;
        return this.editor.chain().splitBlock().setNode("paragraph").run();
      },
    };
  },
});

const PROSE_CLASSES =
  "prose prose-sm max-w-none prose-headings:font-display prose-a:font-bold prose-a:text-foreground prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2";

function ToolbarButton({
  active,
  label,
  onClick,
  disabled,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-9 w-9 items-center justify-center border transition-colors disabled:opacity-40",
        active
          ? "border-foreground bg-primary text-primary-foreground"
          : "border-transparent hover:border-foreground hover:bg-background",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
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
      Placeholder.configure({
        placeholder: placeholder ?? "",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(PROSE_CLASSES, "min-h-[140px] p-4 focus:outline-none"),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  // Sync external value changes (e.g. recording loaded after fetch) without
  // clobbering the cursor while the user is typing.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // Never overwrite the document while the user is actively editing — a
    // programmatic setContent there can leave a stale selection/position and
    // crash ProseMirror ("Position N out of range").
    if (editor.isFocused) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (normalizeHtml(value) !== normalizeHtml(current)) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border-2 border-foreground bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b-2 border-foreground bg-muted p-2">
        <ToolbarButton
          label="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
