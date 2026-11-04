"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  readonly id: string;
  readonly name: string;
}

/**
 * A dropdown that keeps several answers.
 *
 * The native select on this form only holds one value, which is wrong for
 * "which subjects" — a student usually wants two or three. This opens a
 * checkbox sheet instead and shows a short summary on the trigger.
 */
export function MultiSelect({
  label,
  placeholder,
  options,
  values,
  onChange,
  disabled = false,
  title,
}: {
  readonly label: string;
  readonly placeholder: string;
  readonly options: readonly MultiSelectOption[];
  readonly values: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean;
  readonly title?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);

  const first = options.find((option) => option.id === values[0]);
  const summary =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (first?.name ?? placeholder)
        : `${first?.name ?? placeholder} +${values.length - 1}`;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
          values.length === 0 && "text-muted-foreground",
        )}
      >
        <span className="truncate text-left">{summary}</span>
        <CaretDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title ?? label}</DialogTitle>
            <DialogDescription>একাধিক নির্বাচন করা যাবে।</DialogDescription>
          </DialogHeader>

          <div className="-mx-1 max-h-72 overflow-y-auto px-1">
            {options.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs font-semibold text-muted-foreground">
                কোনো অপশন নেই।
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {options.map((option) => {
                  const checked = values.includes(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                          checked
                            ? "border-primary/50 bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            onChange(
                              checked
                                ? values.filter((value) => value !== option.id)
                                : [...values, option.id],
                            )
                          }
                          className="size-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 flex-1">{option.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onChange([])}
              disabled={values.length === 0}
              className="rounded-xl text-xs font-bold"
            >
              সব বাদ
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              ঠিক আছে
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
