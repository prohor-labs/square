"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Add, Calendar, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getCalendarGroups,
  updateCalendarGroups,
} from "@/lib/actions/settings";
import type { CalendarGroup } from "@/lib/calendar-content";
import { toBengaliDigits } from "@/lib/calendar-date";

const MAX_GROUPS = 40;
const MAX_ROWS = 30;

/**
 * The admission schedule, exactly as the calendar shows it: one list of
 * universities, each with its exam units and dates.
 */
export function AdminCalendarContentEditor() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CalendarGroup[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-groups"],
    queryFn: () => getCalendarGroups(),
  });

  // Stays null until the first edit, so a refetch always shows fresh data.
  const groups = draft ?? data ?? [];

  const mutation = useMutation({
    mutationFn: () => updateCalendarGroups(groups),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-groups"] });
    },
  });

  const patchGroup = (index: number, changes: Partial<CalendarGroup>) => {
    setDraft(groups.map((g, i) => (i === index ? { ...g, ...changes } : g)));
  };

  const patchCell = (
    groupIndex: number,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => {
    setDraft(
      groups.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          ...group,
          rows: group.rows.map((row, j) =>
            j === rowIndex
              ? row.map((cell, k) => (k === cellIndex ? value : cell))
              : row,
          ),
        };
      }),
    );
  };

  const examCount = groups.reduce(
    (total, group) => total + group.rows.length,
    0,
  );

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/70 shadow-xs">
      <CardContent className="p-0">
        <div className="flex flex-col justify-between gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <h2 className="text-base font-bold sm:text-lg">
              ভর্তি পরীক্ষার সময়সূচি
            </h2>
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {toBengaliDigits(examCount)} টি পরীক্ষা
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
              সময়সূচি সংরক্ষণ হয়েছে!
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
              {groups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
                  কোনো বিশ্ববিদ্যালয় নেই। নিচের &quot;বিশ্ববিদ্যালয়&quot; বাটনে ক্লিক
                  করুন।
                </p>
              ) : (
                groups.map((group, groupIndex) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: groups are edited in place, never reordered
                    key={groupIndex}
                    className="overflow-hidden rounded-xl border border-border bg-background"
                  >
                    <div className="flex items-center gap-2 border-b bg-muted/40 p-2">
                      <Input
                        value={group.label}
                        onChange={(e) =>
                          patchGroup(groupIndex, { label: e.target.value })
                        }
                        placeholder="বিশ্ববিদ্যালয়ের নাম"
                        className="h-9 flex-1 rounded-md text-sm font-bold"
                        aria-label={`বিশ্ববিদ্যালয় ${groupIndex + 1} এর নাম`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDraft(groups.filter((_, i) => i !== groupIndex))
                        }
                        className="size-8 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`বিশ্ববিদ্যালয় ${groupIndex + 1} মুছুন`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2 p-2">
                      <div className="grid grid-cols-[1fr_1fr] gap-2 px-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                        <span>ইউনিট</span>
                        <span>পরীক্ষার তারিখ</span>
                      </div>

                      {group.rows.length === 0 ? (
                        <p className="py-2 text-center text-[11px] text-muted-foreground">
                          কোনো সারি নেই। নিচের &quot;সারি&quot; বাটনে ক্লিক করুন।
                        </p>
                      ) : (
                        group.rows.map((row, rowIndex) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: rows are edited in place, never reordered
                            key={rowIndex}
                            className="grid grid-cols-[1fr_1fr_auto] gap-2"
                          >
                            <Input
                              value={row[0] ?? ""}
                              onChange={(e) =>
                                patchCell(
                                  groupIndex,
                                  rowIndex,
                                  0,
                                  e.target.value,
                                )
                              }
                              placeholder="ইউনিট (খালি রাখা যায়)"
                              className="h-9 rounded-md text-xs"
                              aria-label={`সারি ${rowIndex + 1}, ইউনিট`}
                            />
                            <Input
                              value={row[1] ?? ""}
                              onChange={(e) =>
                                patchCell(
                                  groupIndex,
                                  rowIndex,
                                  1,
                                  e.target.value,
                                )
                              }
                              placeholder="যেমন: ১২ ডিসেম্বর ২০২৬"
                              className="h-9 rounded-md text-xs"
                              aria-label={`সারি ${rowIndex + 1}, তারিখ`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                patchGroup(groupIndex, {
                                  rows: group.rows.filter(
                                    (_, j) => j !== rowIndex,
                                  ),
                                })
                              }
                              className="size-9 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`সারি ${rowIndex + 1} মুছুন`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={group.rows.length >= MAX_ROWS}
                        onClick={() =>
                          patchGroup(groupIndex, {
                            rows: [...group.rows, ["", ""]],
                          })
                        }
                        className="h-7 gap-1 rounded-md text-[11px]"
                      >
                        <Add className="size-3" /> সারি
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={groups.length >= MAX_GROUPS}
                onClick={() => setDraft([...groups, { label: "", rows: [] }])}
                className="h-9 w-fit gap-1.5 rounded-lg text-xs"
              >
                <Add className="size-3.5" /> বিশ্ববিদ্যালয়
              </Button>

              <p className="text-[11px] text-muted-foreground">
                যা এখানে সেভ করবেন, ক্যালেন্ডারে হুবহু তাই দেখা যাবে। ইউনিট না থাকলে খালি রাখুন।
                সর্বোচ্চ {MAX_GROUPS} বিশ্ববিদ্যালয় ও {MAX_ROWS} সারি।
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
