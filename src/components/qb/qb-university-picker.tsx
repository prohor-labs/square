"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AngleRight, Search } from "@/components/icons";
import {
  canonicalUniversityName,
  QB_GENERAL_UNIVERSITY,
  qbKey,
  searchQbUniversities,
} from "@/lib/qb-universities";
import { cn } from "@/lib/utils";

interface PickerOption {
  readonly key: string;
  readonly label: string;
  readonly sub?: string;
  readonly value: string;
}

/**
 * Searchable public-university picker.
 *
 * The admin never types a university name by hand: the value is always an
 * entry from {@link QB_UNIVERSITIES} (or the explicit "general" option), which
 * is what keeps one university from becoming two groups. Search accepts
 * Bengali, English and abbreviations ("ঢাবি", "dhaka", "DU").
 */
export function QbUniversityPicker({
  id,
  value,
  onChange,
  existingUniversities = [],
}: {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (university: string) => void;
  /** Values already stored in the bank, offered as a "previously used" hint. */
  readonly existingUniversities?: readonly string[];
}): React.ReactElement {
  const uid = useId();
  const listId = `${uid}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const options = useMemo<readonly PickerOption[]>(() => {
    const query = text.trim();
    const list: PickerOption[] = [];

    if (query.length === 0) {
      list.push({
        key: "__general",
        label: QB_GENERAL_UNIVERSITY,
        sub: "বোর্ড/সাধারণ প্রশ্ন — কোনো নির্দিষ্ট বিশ্ববিদ্যালয় নয়",
        value: "",
      });
    }

    for (const university of searchQbUniversities(query)) {
      list.push({
        key: university.id,
        label: university.bn,
        sub: [university.en, university.short[0]].filter(Boolean).join(" · "),
        value: university.bn,
      });
    }

    // Names already stored in the bank but missing from the static list.
    if (query.length > 0) {
      for (const stored of existingUniversities) {
        if (stored.length === 0) continue;
        if (list.some((option) => option.value === stored)) continue;
        if (!qbKey(stored).includes(qbKey(query))) continue;
        list.push({
          key: `stored-${stored}`,
          label: stored,
          sub: "আগে ব্যবহৃত",
          value: stored,
        });
      }
    }

    const trimmed = query.length > 0 ? canonicalUniversityName(query) : "";
    if (
      list.length === 0 &&
      trimmed.length > 0 &&
      !existingUniversities.includes(trimmed)
    ) {
      list.push({
        key: "__custom",
        label: `“${trimmed}” ব্যবহার করুন`,
        sub: "তালিকায় নেই — এই নামেই সংরক্ষণ হবে",
        value: trimmed,
      });
    }

    return list;
  }, [text, existingUniversities]);

  const choose = (option: PickerOption) => {
    onChange(option.value);
    setText(option.value);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(current + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (open && options[active]) {
        event.preventDefault();
        choose(options[active]);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setText(value);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={text}
          placeholder="ঢাবি / Dhaka / DU লিখে খুঁজুন"
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(event) => {
            setOpen(true);
            setActive(0);
            event.currentTarget.select();
          }}
          onBlur={() => setText(value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <AngleRight
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 rotate-90 text-muted-foreground transition-transform",
            open && "-rotate-90",
          )}
          aria-hidden="true"
        />
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              কিছু পাওয়া যায়নি।
            </p>
          ) : (
            options.map((option, index) => (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  index === active ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                <span className="text-xs font-bold text-foreground">
                  {option.label}
                </span>
                {option.sub ? (
                  <span className="text-[10px] text-muted-foreground">
                    {option.sub}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
