import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOB_TITLES } from "@/lib/job-titles";

const MAX_RESULTS = 50;

interface JobTitleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

// One row in the dropdown: either a real suggestion or the "use what you typed"
// custom entry. `title` is the value that gets committed on selection.
interface Option {
  key: string;
  title: string;
  custom: boolean;
}

// Pico-styled autocomplete for picking a job title. Filters the static
// JOB_TITLES list as the user types; any typed value is kept verbatim as a valid
// custom (free-text) entry. Both mouse and keyboard selection are supported:
// ArrowUp/ArrowDown move the active option, Enter selects it, Escape closes.
export function JobTitleCombobox({
  value,
  onChange,
  id,
  placeholder = "Start typing your job title…",
}: JobTitleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  const query = value.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return JOB_TITLES.slice(0, MAX_RESULTS);
    const starts: string[] = [];
    const contains: string[] = [];
    for (const t of JOB_TITLES) {
      const lower = t.toLowerCase();
      if (lower.startsWith(query)) starts.push(t);
      else if (lower.includes(query)) contains.push(t);
      if (starts.length >= MAX_RESULTS) break;
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [query]);

  const exactMatch = useMemo(
    () => JOB_TITLES.some((t) => t.toLowerCase() === query),
    [query],
  );
  const showCustom = value.trim().length > 0 && !exactMatch;

  // Flattened option list (custom row first), the single source of truth for
  // both rendering and keyboard navigation.
  const options = useMemo<Option[]>(() => {
    const opts: Option[] = [];
    if (showCustom) {
      opts.push({ key: "__custom__", title: value.trim(), custom: true });
    }
    for (const t of matches) opts.push({ key: t, title: t, custom: false });
    return opts;
  }, [showCustom, value, matches]);

  // Keep the active index in range as the option list changes.
  useEffect(() => {
    setActiveIndex((i) =>
      options.length === 0 ? 0 : Math.min(i, options.length - 1),
    );
  }, [options.length]);

  // Scroll the active option into view when navigating with the keyboard.
  useLayoutEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(optionId(activeIndex))}`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (title: string) => {
    onChange(title);
    setOpen(false);
    inputRef.current?.focus();
  };

  const openMenu = () => {
    setActiveIndex(0);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          openMenu();
          return;
        }
        setActiveIndex((i) => (options.length ? (i + 1) % options.length : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) {
          openMenu();
          return;
        }
        setActiveIndex((i) =>
          options.length ? (i - 1 + options.length) % options.length : 0,
        );
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open && options.length) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter": {
        if (!open) return;
        const opt = options[activeIndex];
        if (opt) {
          e.preventDefault();
          select(opt.title);
        }
        break;
      }
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options.length ? optionId(activeIndex) : undefined
        }
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        className="flex h-11 w-full border-2 border-foreground bg-background px-3 py-2 pr-10 text-sm font-medium outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Toggle job title suggestions"
        className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-foreground"
        // Use mousedown so the toggle fires before the input's blur closes it.
        onMouseDown={(e) => {
          e.preventDefault();
          if (open) {
            setOpen(false);
          } else {
            openMenu();
          }
          inputRef.current?.focus();
        }}
      >
        <ChevronsUpDown className="h-4 w-4 opacity-60" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-[280px] w-full overflow-y-auto border-4 border-foreground bg-popover py-1 text-popover-foreground shadow-md"
        >
          {options.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching titles.
            </li>
          )}
          {options.map((opt, i) => {
            const active = i === activeIndex;
            const selected =
              !opt.custom &&
              value.trim().toLowerCase() === opt.title.toLowerCase();
            return (
              <li
                key={opt.key}
                id={optionId(i)}
                role="option"
                aria-selected={active}
                // mousedown (not click) so selection runs before the input blur.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(opt.title);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                  active && "bg-accent text-accent-foreground",
                )}
              >
                {opt.custom ? (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="truncate font-bold">
                      Use “{opt.title}”
                    </span>
                  </>
                ) : (
                  <>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{opt.title}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
