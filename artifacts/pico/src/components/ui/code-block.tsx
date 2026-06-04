import React from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
}

export function CodeBlock({ code, className, ...props }: CodeBlockProps) {
  return (
    <pre 
      className={cn(
        "bg-foreground text-background p-4 rounded-sm border-4 border-foreground overflow-x-auto text-sm font-mono leading-relaxed shadow-[4px_4px_0px_0px_var(--primary)] selection:bg-primary selection:text-foreground",
        className
      )}
      {...props}
    >
      <code>{code}</code>
    </pre>
  );
}
