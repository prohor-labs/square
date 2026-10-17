"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useTransition } from "react";
import { CloseCircle, Filter } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";

/** A filter dimension with the values that actually occur in the bank. */
export interface QbFilterOption {
  readonly value: string;
  readonly label: string;
  readonly questions?: number;
}

export interface QbFilterDef {
  readonly param: string;
  readonly label: string;
  readonly options: readonly QbFilterOption[];
  /**
   * The exam this dimension belongs to. A board question has no unit, so the
   * unit filter is not rendered for it rather than rendered empty.
   */
  readonly scope?: "board" | "university" | "engineering" | "medical";
  /** "any" always shows; the rest appear only once the earlier ones are set. */
  readonly dependsOn?: readonly string[];
}

/**
 * The filter rail.
 *
 * Filters live in the query string, which is what makes the back button, a
 * shared link and a refresh all behave. Changing one resets to page one, because
 * page four of the previous result set says nothing about the new one.
 */
export function QbFilterPanel({
  filters,
  scope,
  onApply,
}: {
  readonly filters: readonly QbFilterDef[];
  readonly scope?: string;
  readonly onApply?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const active = params.get("search");
  const selected = new Map<string, string>();
  for (const key of [
    "type",
    "exam",
    "institute",
    "year",
    "group",
    "unit",
    "subject",
    "chapter",
    "topic",
  ]) {
    const value = params.get(key);
    if (value) selected.set(key, value);
  }

  const apply = (next: URLSearchParams) => {
    next.delete("page");
    onApply?.();
    startTransition(() => {
      router.replace(next.toString() ? `?${next.toString()}` : "?", {
        scroll: false,
      });
    });
  };

  const setFilter = (param: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    // Narrowing the exam type can invalidate the institute chosen under it.
    if (param === "exam") next.delete("institute");
    apply(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    apply(next);
  };

  const visible = filters.filter((filter) => {
    if (filter.scope && scope && filter.scope !== scope) return false;
    if (!filter.dependsOn) return true;
    // A dimension only earns its space once the one it hangs off is chosen.
    return filter.dependsOn.some((key) => selected.has(key));
  });

  const hasAny = selected.size > 0 || Boolean(active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold">
          <Filter className="size-4" />
          ফিল্টার
          {pending && <Spinner className="size-3.5 text-muted-foreground" />}
        </h2>
        {hasAny && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 cursor-pointer px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            সব ফিল্টার মুছুন
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {[...selected.entries()].map(([param, value]) => (
            <li key={param}>
              <button
                type="button"
                onClick={() => setFilter(param, "")}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-semibold transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                {filters.find((f) => f.param === param)?.label ?? param}:{" "}
                {value}
                <CloseCircle className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">এখানে আলাদা ফিল্টার নেই।</p>
      ) : (
        <div className="space-y-3">
          {visible.map((filter) => (
            <div key={filter.param} className="space-y-1.5">
              <Label htmlFor={`qb-filter-${filter.param}`} className="text-xs">
                {filter.label}
              </Label>
              <NativeSelect
                id={`qb-filter-${filter.param}`}
                size="sm"
                // The wrapper is w-fit by default, which would leave a select
                // narrower than the rail it sits in.
                className="w-full"
                value={selected.get(filter.param) ?? ""}
                onChange={(event) =>
                  setFilter(filter.param, event.target.value)
                }
              >
                <option value="">সব</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.questions !== undefined
                      ? ` (${option.questions})`
                      : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small wrapper so a page can put the rail in a drawer on a phone. */
export function QbFilterField({ children }: { readonly children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
