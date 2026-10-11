"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArchiveBox, TickCircle } from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getBatchesAction } from "@/lib/actions/batch";
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
 * Every exam in the system, one checkbox each. Ticking puts the exam on the
 * chosen course's আর্কাইভ পরীক্ষা list — the archive belongs to the course, so
 * the same exam can be archived for one batch and left off another.
 */
export function BatchArchiveTab({
  batchId,
  courses,
}: {
  /** The course whose page this tab sits on; the picker starts here. */
  readonly batchId: string;
  /** Every active course, for the picker. */
  readonly courses: readonly { id: string; name: string }[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState(batchId);

  // A tab opened for one course can be pointed at any other.
  const { data: allCourses = courses } = useQuery({
    queryKey: ["archive-courses"],
    queryFn: async () => {
      const res = await getBatchesAction();
      return (res.data ?? []) as { id: string; name: string }[];
    },
    initialData: courses,
  });

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["batch-archive-options", courseId],
    queryFn: () => getBatchArchiveOptionsAction(courseId),
  });

  const mutation = useMutation({
    mutationFn: (input: { examId: string; archived: boolean }) =>
      setBatchArchiveAction(courseId, input.examId, input.archived),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batch-archive-options", courseId],
      });
    },
  });

  const trimmed = search.trim().toLowerCase();
  const shown = trimmed
    ? exams.filter((exam) => exam.title.toLowerCase().includes(trimmed))
    : exams;
  const archivedCount = exams.filter((exam) => exam.archived).length;
  const courseName = allCourses.find((c) => c.id === courseId)?.name;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 font-bold">
          <ArchiveBox className="size-5 text-primary" />
          আর্কাইভ পরীক্ষা
        </h3>
        <p className="text-xs text-muted-foreground">
          কোর্স বেছে নিয়ে টিক দিন — পরীক্ষাটি ওই কোর্সের আর্কাইভে যোগ হবে।
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">
            কোন কোর্সের আর্কাইভ
          </span>
          <Select value={courseId} onValueChange={(v) => v && setCourseId(v)}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="কোর্স নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {allCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="shrink-0 rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary sm:mb-0.5">
          {courseName ? `${courseName} · ` : ""}আর্কাইভে{" "}
          {archivedCount.toLocaleString("bn-BD")} টি
        </span>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="পরীক্ষার নাম খুঁজুন…"
        className="h-10 rounded-xl"
        aria-label="পরীক্ষা খুঁজুন"
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>লোড হচ্ছে...</span>
        </div>
      ) : shown.length === 0 ? (
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
    </div>
  );
}
