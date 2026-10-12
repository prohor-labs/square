"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Add, Link2, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getCalendarApplications,
  updateCalendarApplications,
} from "@/lib/actions/settings";
import type { ApplicationEntry } from "@/lib/calendar-content";
import { toBengaliDigits } from "@/lib/calendar-date";

const MAX_ROWS = 60;

/**
 * The আবেদন লিংক tab's data: which units are open, when, for how much, and
 * where to apply. Fees and links stay blank until a university publishes them.
 */
export function AdminApplicationEditor() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ApplicationEntry[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-applications"],
    queryFn: () => getCalendarApplications(),
  });

  // Stays null until the first edit, so a refetch always shows fresh data.
  const entries = draft ?? data ?? [];

  const mutation = useMutation({
    mutationFn: () => updateCalendarApplications(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-applications"] });
    },
  });

  const patch = (index: number, changes: Partial<ApplicationEntry>) => {
    setDraft(
      entries.map((entry, i) =>
        i === index ? { ...entry, ...changes } : entry,
      ),
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/70 shadow-xs">
      <CardContent className="p-0">
        <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            <h2 className="text-base font-bold sm:text-lg">আবেদন তথ্য</h2>
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {toBengaliDigits(entries.length)} টি
            </span>
          </div>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isLoading}
            className="h-10 rounded-xl px-6 font-bold shadow-sm"
          >
            {mutation.isPending ? (
              <>
                <Spinner className="mr-2 size-4" /> সংরক্ষণ হচ্ছে...
              </>
            ) : (
              "সংরক্ষণ করুন"
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          {mutation.isSuccess && !mutation.isPending && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              আবেদন তথ্য সংরক্ষণ হয়েছে!
            </p>
          )}
          {mutation.isError && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              {mutation.error.message}
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              <span>লোড হচ্ছে...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr] gap-2 px-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                <span>বিশ্ববিদ্যালয় (ইউনিট)</span>
                <span>সময়কাল</span>
                <span>ফি</span>
                <span>লিংক</span>
              </div>

              {entries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
                  কোনো তথ্য নেই। নিচের &quot;সারি&quot; বাটনে ক্লিক করুন।
                </p>
              ) : (
                entries.map((entry, index) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place, never reordered
                    key={index}
                    className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_auto] gap-2"
                  >
                    <Input
                      value={entry.label}
                      onChange={(e) => patch(index, { label: e.target.value })}
                      placeholder="যেমন: ঢাবি (A)"
                      className="h-9 rounded-md text-xs"
                      aria-label={`সারি ${index + 1}, বিশ্ববিদ্যালয়`}
                    />
                    <Input
                      value={entry.period}
                      onChange={(e) => patch(index, { period: e.target.value })}
                      placeholder="যেমন: ১১ নভেম্বর - ২৫ নভেম্বর"
                      className="h-9 rounded-md text-xs"
                      aria-label={`সারি ${index + 1}, সময়কাল`}
                    />
                    <Input
                      value={entry.fee}
                      onChange={(e) => patch(index, { fee: e.target.value })}
                      placeholder="প্রকাশিত হলে"
                      className="h-9 rounded-md text-xs"
                      aria-label={`সারি ${index + 1}, ফি`}
                    />
                    <Input
                      value={entry.link}
                      onChange={(e) => patch(index, { link: e.target.value })}
                      placeholder="প্রকাশিত হলে"
                      className="h-9 rounded-md text-xs"
                      aria-label={`সারি ${index + 1}, লিংক`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraft(entries.filter((_, i) => i !== index))
                      }
                      className="size-9 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`সারি ${index + 1} মুছুন`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={entries.length >= MAX_ROWS}
                onClick={() =>
                  setDraft([
                    ...entries,
                    { label: "", period: "", fee: "", link: "" },
                  ])
                }
                className="h-9 w-fit gap-1.5 rounded-lg text-xs"
              >
                <Add className="size-3.5" /> সারি
              </Button>

              <p className="text-[11px] text-muted-foreground">
                সময়কাল লিখলে ওই তারিখ থেকেই &quot;কত দিন পর শুরু&quot; গণনা হবে। ফি ও
                লিংক প্রকাশিত না হওয়া পর্যন্ত খালি রাখুন।
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
