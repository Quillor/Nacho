import { Link } from "wouter";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsSection {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  danger?: boolean;
}

/** Tappable list of settings sections; each row links to its detail page. */
export function SettingsList({ sections }: { sections: SettingsSection[] }) {
  return (
    <div className="border-2 border-foreground bg-card">
      {sections.map((section, i) => {
        const Icon = section.icon;
        return (
          <Link
            key={section.slug}
            href={`/settings/${section.slug}`}
            className={cn(
              "group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted",
              i !== 0 && "border-t-2 border-foreground",
              section.danger && "text-destructive hover:bg-destructive/10",
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground",
                section.danger
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className={cn(
                  "font-display text-lg font-extrabold tracking-tight",
                  section.danger && "text-destructive",
                )}
              >
                {section.title}
              </h2>
              <p className="truncate text-sm font-medium text-muted-foreground">
                {section.description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        );
      })}
    </div>
  );
}
