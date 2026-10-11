"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArchiveBox, TickCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getBatchArchiveOptionsAction,
  setBatchArchiveAction,
} from "@/lib/actions/batch-archive";
import { cn } from "@/lib/utils";

const STANDARD_LABELS: Record<string, string> = {
  HSC: "HSC বোর্ড",
  Varsity: "ভার্সিটি",
  Engineering: "ইঞ্জিনিয়ারিং",
  Medical: "মেডিকেল",
};

/**
 * Every exam in the system, one checkbox each. Ticking puts the exam on this
 * batch's আর্কাইভ পরীক্ষা list — the archive belongs to the batch, so the same
 * exam can be archived for one course and left off another.
 */
export function BatchArchiveTab({ batchId }: { readonly batchId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["batch-archive-options", batchId],
    queryFn: () => getBatchArchiveOptionsAction(batchId),
  });

  const mutation = useMutation({
    mutationFn: (input: { examId: string; archived: boolean }) =>
      setBatchArchiveAction(batchId, input.examId, input.archived),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batch-archive-options", batchId],
      });
    },
  });

  const trimmed = search.trim().toLowerCase();
  const shown = trimmed
    ? exams.filter((exam) => exam.title.toLowerCase().includes(trimmed))
    : exams;
  const archivedCount = exams.filter((exam) => exam.archived).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 font-bold">
            <ArchiveBox className="size-5 text-primary" />
            আর্কাইভ পরীক্ষা
          </h3>
          <p className="text-xs text-muted-foreground">
            টিক দিলে পরীক্ষাটি এই কোর্সের আর্কাইভে যোগ হবে। ছাত্ররা কেবল নিজ কোর্সের
            আর্কাইভই দেখবে।
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          আর্কাইভে {archivedCount} টি
        </span>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="পরীক্ষার নাম খুঁজুন…"
        className="h-10 rounded-xl"
        aria-label="পরীক্ষা খুঁজুন"
      />

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-xs text-muted-foreground">
          কোনো পরীক্ষা পাওয়া যায়নি।
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {shown.map((exam) => (
            <label
              key={exam.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent",
                mutation.isPending && "opacity-60",
              )}
            >
              <input
                type="checkbox"
                checked={exam.archived}
                disabled={mutation.isPending}
                onChange={(e) =>
                  mutation.mutate({
                    examId: exam.id,
                    archived: e.target.checked,
                  })
                }
                className="size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {exam.title}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {STANDARD_LABELS[exam.standard] ?? exam.standard}
                </span>
              </span>
              {exam.archived && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <TickCircle className="size-3.5" />
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      {mutation.isError && (
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => mutation.reset()}
        >
          আবার চেষ্টা করুন
        </Button>
      )}
    </div>
  );
}
