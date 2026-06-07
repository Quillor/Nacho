import { marked } from "marked";
import DOMPurify from "dompurify";

// Speaker notes are stored as plain Markdown source. This renders that source to
// sanitized HTML for the preview/overlay. GFM + single-newline line breaks make
// the writing experience predictable (a newline is a line break).
marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
  const html = marked.parse(md ?? "", { async: false }) as string;
  return DOMPurify.sanitize(html);
}
