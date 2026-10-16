"use client";

import { useMemo, useState } from "react";
import {
  FEATURE_ICON_CHOICES,
  getFeatureIcon,
} from "@/components/course-feature-icon";
import { Search } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Input } from "@/components/ui/input";
import { FEATURE_ICON_GROUPS } from "@/lib/course-features";
import { cn } from "@/lib/utils";

/**
 * Lets the admin pick the picture that goes with a course feature.
 *
 * The list is searched by Bangla name, the English icon name and the words
 * describing its group, so "পরীক্ষা", "exam" and "book" all land somewhere
 * useful. Filtering happens in memory over the hundred-odd registered icons,
 * which is small enough that a server round-trip would only add latency.
 */
export function FeatureIconPicker({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const keywordFor = useMemo(() => {
    const map = new Map(FEATURE_ICON_GROUPS.map((g) => [g.id, g.keywords]));
    return map;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FEATURE_ICON_CHOICES;
    return FEATURE_ICON_CHOICES.filter(
      (choice) =>
        choice.label.toLowerCase().includes(q) ||
        choice.name.toLowerCase().includes(q) ||
        keywordFor.get(choice.group)?.toLowerCase().includes(q),
    );
  }, [query, keywordFor]);

  const grouped = useMemo(() => {
    return FEATURE_ICON_GROUPS.map((group) => ({
      ...group,
      icons: results.filter((choice) => choice.group === group.id),
    })).filter((group) => group.icons.length > 0);
  }, [results]);

  const Current = getFeatureIcon(value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground transition-colors hover:border-primary/60 hover:text-primary"
        aria-label="আইকন বদলান"
        title="আইকন বদলান"
      >
        <Current className="size-4" />
      </button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="আইকন বেছে নিন"
        description="ফিচারটির সাথে যে আইকন মানানসই, সেটি বেছে নিন।"
        className="sm:max-w-2xl"
      >
        <div className="space-y-5">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="আইকন খুঁজুন — যেমন: ক্যালেন্ডার, বই, ট্রফি, exam"
              className="pl-9"
            />
          </div>

          {grouped.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              &quot;{query}&quot; নামে কোনো আইকন পাওয়া যায়নি।
            </p>
          ) : (
            <div className="max-h-[45vh] space-y-5 overflow-y-auto pr-1">
              {grouped.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <h3 className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                    {group.icons.map((choice) => {
                      const Icon = getFeatureIcon(choice.name);
                      const selected = choice.name === value;
                      return (
                        <button
                          key={choice.name}
                          type="button"
                          title={choice.label}
                          aria-label={choice.label}
                          aria-pressed={selected}
                          onClick={() => {
                            onChange(choice.name);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex aspect-square cursor-pointer items-center justify-center rounded-xl border transition-all",
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-muted/20 text-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
                          )}
                        >
                          <Icon className="size-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
