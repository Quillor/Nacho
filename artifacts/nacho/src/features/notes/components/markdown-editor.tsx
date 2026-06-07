import { useLayoutEffect, useRef, useState } from "react";
import {
  Heading,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Pencil,
  Eye,
  Columns2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "../markdown";

type Mode = "edit" | "preview" | "split";

interface MarkdownEditorProps {
  value: string;
  onChange: (md: string) => void;
  /** Initial mode; the user can switch with the segmented control. */
  defaultMode?: Mode;
  placeholder?: string;
  className?: string;
}

// A lightweight, reliable Markdown editor: a plain textarea for the source plus
// a rendered preview. Because the source is just text, typing "## " never moves
// the cursor or merges lines — the bug class of WYSIWYG auto-formatting is gone.
// The toolbar edits the text directly and restores the caret deterministically.
export function MarkdownEditor({
  value,
  onChange,
  defaultMode = "edit",
  placeholder,
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Caret to restore after a programmatic (toolbar) edit; null for plain typing.
  const pendingSel = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    if (pendingSel.current && taRef.current) {
      const [a, b] = pendingSel.current;
      taRef.current.focus();
      taRef.current.setSelectionRange(a, b);
      pendingSel.current = null;
    }
  }, [value]);

  /** Apply a programmatic edit and queue the caret position to restore. */
  const edit = (next: string, selStart: number, selEnd = selStart) => {
    pendingSel.current = [selStart, selEnd];
    onChange(next);
  };

  const lineBounds = (text: string, pos: number) => {
    const start = text.lastIndexOf("\n", pos - 1) + 1;
    let end = text.indexOf("\n", pos);
    if (end === -1) end = text.length;
    return { start, end };
  };

  // Heading button cycles the current line: none → H1 → H2 → H3 → none.
  const cycleHeading = () => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const { start, end } = lineBounds(value, selectionStart);
    const line = value.slice(start, end);
    const m = line.match(/^(#{1,3})\s+/);
    const stripped = line.replace(/^#{1,3}\s+/, "");
    let next: string;
    if (!m) next = `# ${stripped}`;
    else if (m[1].length === 1) next = `## ${stripped}`;
    else if (m[1].length === 2) next = `### ${stripped}`;
    else next = stripped;
    const delta = next.length - line.length;
    edit(
      value.slice(0, start) + next + value.slice(end),
      selectionStart + delta,
      selectionEnd + delta,
    );
  };

  const toggleLinePrefix = (kind: "bullet" | "number") => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd } = ta;
    const { start, end } = lineBounds(value, selectionStart);
    const line = value.slice(start, end);
    const hasBullet = /^- /.test(line);
    const hasNumber = /^\d+\.\s/.test(line);
    const stripped = line.replace(/^(- |\d+\.\s)/, "");
    let next: string;
    if (kind === "bullet") next = hasBullet ? stripped : `- ${stripped}`;
    else next = hasNumber ? stripped : `1. ${stripped}`;
    const delta = next.length - line.length;
    edit(
      value.slice(0, start) + next + value.slice(end),
      selectionStart + delta,
      selectionEnd + delta,
    );
  };

  const wrap = (token: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const hadSelection = e > s;
    const inner = hadSelection ? value.slice(s, e) : "text";
    const next = value.slice(0, s) + token + inner + token + value.slice(e);
    edit(next, s + token.length, s + token.length + inner.length);
  };

  const insertDivider = () => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s } = ta;
    const before = value.slice(0, s);
    const needsNL = before.length > 0 && !before.endsWith("\n");
    const block = `${needsNL ? "\n" : ""}---\n`;
    const next = before + block + value.slice(s);
    const caret = (before + block).length;
    edit(next, caret);
  };

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-foreground transition-colors hover:border-foreground hover:bg-background";
  const modeBtn = (m: Mode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className={cn(
        "flex h-8 items-center gap-1 rounded-sm border px-2 text-xs font-bold transition-colors",
        mode === m
          ? "border-foreground bg-primary text-primary-foreground"
          : "border-transparent hover:border-foreground hover:bg-background",
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("flex flex-col bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-muted p-2">
        <div className="flex items-center gap-1">
          <button type="button" title="Heading (cycle H1–H3)" aria-label="Heading" onClick={cycleHeading} className={btn}>
            <Heading className="h-4 w-4" />
          </button>
          <button type="button" title="Bold" aria-label="Bold" onClick={() => wrap("**")} className={btn}>
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" title="Italic" aria-label="Italic" onClick={() => wrap("*")} className={btn}>
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" title="Bullet list" aria-label="Bullet list" onClick={() => toggleLinePrefix("bullet")} className={btn}>
            <List className="h-4 w-4" />
          </button>
          <button type="button" title="Numbered list" aria-label="Numbered list" onClick={() => toggleLinePrefix("number")} className={btn}>
            <ListOrdered className="h-4 w-4" />
          </button>
          <button type="button" title="Divider" aria-label="Divider" onClick={insertDivider} className={btn}>
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {modeBtn("edit", <Pencil className="h-3.5 w-3.5" />, "Edit")}
          {modeBtn("split", <Columns2 className="h-3.5 w-3.5" />, "Split")}
          {modeBtn("preview", <Eye className="h-3.5 w-3.5" />, "Preview")}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {(mode === "edit" || mode === "split") && (
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck
            className={cn(
              "min-h-[160px] w-full flex-1 resize-none bg-background p-4 font-mono text-sm leading-relaxed outline-none",
              mode === "split" && "border-r-2 border-foreground",
            )}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div
            className="prose prose-sm min-h-[160px] w-full flex-1 max-w-none overflow-y-auto p-4 prose-headings:font-display prose-headings:font-extrabold"
            // Sanitized in renderMarkdown.
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>
    </div>
  );
}
