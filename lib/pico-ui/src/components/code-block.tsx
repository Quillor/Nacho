import React from "react";
import { cn } from "../lib/utils";
import { picoMeta } from "../lib/pico-meta";

/** Props for {@link CodeBlock}. Pass the snippet as the `code` string. */
interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
}

/**
 * Displays a snippet of code in a chunky, monospaced block with the signature
 * Pico shadow. Use it for inline code samples, command output, or config
 * examples; pass the snippet via the `code` prop.
 */
export function CodeBlock({ code, className, ...props }: CodeBlockProps) {
  return (
    <pre 
      className={cn(
        "bg-foreground text-background p-4 rounded-sm border-2 border-foreground overflow-x-auto text-sm font-mono leading-relaxed shadow-[4px_4px_0px_0px_var(--primary)] selection:bg-accent selection:text-foreground",
        className
      )}
      {...picoMeta("CodeBlock")}
      {...props}
    >
      <code>{code}</code>
    </pre>
  );
}
