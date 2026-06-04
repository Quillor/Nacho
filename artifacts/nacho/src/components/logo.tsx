import { cn } from "@/lib/utils";

const base = import.meta.env.BASE_URL;

interface LogoProps {
  /** "wordmark" renders the play-button mark + "Nacho"; "mark" renders only the mark. */
  variant?: "wordmark" | "mark";
  className?: string;
}

/**
 * The Nacho brand logo. Renders the real brand assets from /public so every
 * surface (app shell, public view, landing page, etc.) stays consistent.
 * Size the logo by setting a height in `className` (width stays proportional).
 */
export function Logo({ variant = "wordmark", className }: LogoProps) {
  const src = variant === "mark" ? `${base}logo-mark.svg` : `${base}logo.svg`;
  return (
    <img
      src={src}
      alt="Nacho"
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
