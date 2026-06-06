import { Link } from "wouter";
import { useGetPublicTos } from "@workspace/api-client-react";
import { Logo } from "@/components/logo";

function renderMarkdown(content: string): string {
  // Minimal, safe markdown rendering for headings, bold, and paragraphs.
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = content.split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      const text = escape(paragraph.join(" ")).replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>",
      );
      html.push(`<p>${text}</p>`);
      paragraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flush();
      html.push(`<h3>${escape(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flush();
      html.push(`<h2>${escape(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      flush();
      html.push(`<h1>${escape(trimmed.slice(2))}</h1>`);
    } else {
      paragraph.push(trimmed);
    }
  }
  flush();
  return html.join("\n");
}

export function Terms() {
  const { data, isLoading } = useGetPublicTos();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-6 md:px-12 border-b-2 border-foreground">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-9" />
          </Link>
          <Link
            href="/"
            className="font-bold text-foreground/80 hover:text-foreground hover:underline transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <p className="text-foreground/70">Loading terms…</p>
          ) : data && data.content.trim() ? (
            <article
              className="prose prose-neutral max-w-none prose-headings:font-black prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-foreground/80"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(data.content),
              }}
            />
          ) : (
            <p className="text-foreground/70">
              Terms of service are not available yet.
            </p>
          )}
          {data?.updatedAt && data.content.trim() ? (
            <p className="mt-10 text-sm text-foreground/60">
              Last updated {new Date(data.updatedAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
