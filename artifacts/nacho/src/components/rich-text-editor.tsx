import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOLS: { cmd: string; icon: typeof Bold; label: string }[] = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string) => {
    if (cmd === "createLink") {
      const url = window.prompt("Link URL");
      if (url) document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false);
    }
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border-4 border-foreground bg-background">
      <div className="flex items-center gap-1 border-b-4 border-foreground bg-muted p-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.cmd}
              type="button"
              title={t.label}
              onMouseDown={(e) => {
                e.preventDefault();
                exec(t.cmd);
              }}
              className="flex h-9 w-9 items-center justify-center border-2 border-transparent transition-colors hover:border-foreground hover:bg-background"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <button
          type="button"
          title="Link"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("createLink");
          }}
          className="flex h-9 w-9 items-center justify-center border-2 border-transparent transition-colors hover:border-foreground hover:bg-background"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className={cn(
          "prose prose-sm min-h-[140px] max-w-none p-4 focus:outline-none",
          "prose-headings:font-display prose-a:text-primary",
          "empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}
