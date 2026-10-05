"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarTick } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { updateBatchExamAction } from "@/lib/actions/batch";
import { fromDatetimeLocalToDhakaIso, toDatetimeLocal } from "@/lib/date";

export interface ExamScheduleAssignment {
  readonly batchExamId: string;
  readonly batchId: string;
  readonly batchName: string;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
}

interface ExamScheduleModalProps {
  readonly examTitle: string;
  readonly assignments: readonly ExamScheduleAssignment[];
  readonly trigger?: React.ReactNode;
}

/**
 * Sets an exam's live window straight from the exams list.
 *
 * The schedule lives on the batch assignment, so when an exam sits in more than
 * one batch the admin picks which batch's window to edit — each batch can have
 * its own timings.
 */
export function ExamScheduleModal({
  examTitle,
  assignments,
  trigger,
}: ExamScheduleModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(assignments[0]?.batchExamId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active =
    assignments.find((a) => a.batchExamId === activeId) ?? assignments[0];
  const [startsAt, setStartsAt] = useState(
    active ? toDatetimeLocal(active.startsAt) : "",
  );
  const [endsAt, setEndsAt] = useState(
    active ? toDatetimeLocal(active.endsAt) : "",
  );

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && active) {
      setStartsAt(toDatetimeLocal(active.startsAt));
      setEndsAt(toDatetimeLocal(active.endsAt));
      setError(null);
    }
  }

  function pickAssignment(id: string) {
    setActiveId(id);
    const picked = assignments.find((a) => a.batchExamId === id);
    if (picked) {
      setStartsAt(toDatetimeLocal(picked.startsAt));
      setEndsAt(toDatetimeLocal(picked.endsAt));
    }
    setError(null);
  }

  async function save(start: string, end: string) {
    if (!active) return;
    setLoading(true);
    setError(null);

    if (start && end && new Date(end) <= new Date(start)) {
      setError("শেষের সময় শুরুর সময়ের পরে হতে হবে");
      setLoading(false);
      return;
    }

    const res = await updateBatchExamAction(
      active.batchExamId,
      active.batchId,
      {
        startsAt: fromDatetimeLocalToDhakaIso(start),
        endsAt: fromDatetimeLocalToDhakaIso(end),
      },
    );

    setLoading(false);
    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error || "সময় সেভ করা যায়নি");
    }
  }

  if (assignments.length === 0) return null;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="পরীক্ষার সময়সূচি"
      description={examTitle}
      className="sm:max-w-lg"
      trigger={
        trigger ?? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-xs h-8 px-3"
          >
            সময়
          </Button>
        )
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save(startsAt, endsAt);
        }}
      >
        {assignments.length > 1 && (
          <div className="space-y-1.5">
            <Label htmlFor="schedule-batch" className="text-xs font-semibold">
              কোন ব্যাচের সময় বদলাবেন
            </Label>
            <select
              id="schedule-batch"
              value={activeId}
              onChange={(e) => pickAssignment(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              {assignments.map((a) => (
                <option key={a.batchExamId} value={a.batchExamId}>
                  {a.batchName}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-start" className="text-xs font-semibold">
              শুরুর সময়
            </Label>
            <Input
              id="schedule-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-end" className="text-xs font-semibold">
              শেষের সময়
            </Label>
            <Input
              id="schedule-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-right">
          বাংলাদেশ সময় (UTC+6)
        </p>

        <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed bg-muted/40 border border-border/50 rounded-xl p-3">
          <li>• দুটো খালি রাখলে পরীক্ষাটি সবসময় লাইভ থাকবে।</li>
          <li>• সময়ের মধ্যে দিলে ফলাফল মেরিট লিস্টে যাবে।</li>
          <li>• শুরুর আগে দিতে পারবে না। শেষের পরে দিলে প্র্যাকটিস হিসেবে গণ্য হবে।</li>
        </ul>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => {
              setStartsAt("");
              setEndsAt("");
            }}
            className="rounded-xl h-10 px-3 text-xs font-semibold"
          >
            সময় মুছে ফেলুন
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setOpen(false)}
            className="rounded-xl h-10 px-4 text-xs font-semibold"
          >
            বাতিল
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl h-10 px-4 text-xs font-semibold"
          >
            {loading ? (
              <Spinner className="size-3.5" />
            ) : (
              <CalendarTick className="size-3.5" />
            )}
            সেভ করুন
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
