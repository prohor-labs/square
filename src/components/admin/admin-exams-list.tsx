"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExamEditorModal } from "@/components/admin/exam-editor-modal";
import {
  type ExamScheduleAssignment,
  ExamScheduleModal,
} from "@/components/admin/exam-schedule-modal";
import { QuickList } from "@/components/admin/quick-list";
import {
  CalendarTick,
  Chart,
  Clipboard,
  Edit,
  TaskSquare,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatBanglaDateTime } from "@/lib/date";

interface Batch {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  slug: string;
  type: string;
  standard?: string;
  isPublished: boolean;
  durationMinutes: number;
  totalMarks: number;
  batchExams: Array<{
    id: string;
    batchId: string;
    startsAt?: string | null;
    endsAt?: string | null;
    batch: Batch | null;
  }>;
}

interface AdminExamsListProps {
  exams: Exam[];
}

const TYPE_LABELS: Record<string, string> = {
  practice: "Practice",
  chapter_test: "Chapter Test",
  weekly: "Weekly",
  model_test: "Model Test",
  live_contest: "Live Contest",
};

/** Short human label for an exam's window status, shown in the list. */
function scheduleLabel(
  startsAt?: string | null,
  endsAt?: string | null,
): { text: string; className: string } | null {
  if (!startsAt && !endsAt) {
    return {
      text: "সবসময় লাইভ",
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
  }
  const from = startsAt ? formatBanglaDateTime(startsAt) : "";
  const to = endsAt ? formatBanglaDateTime(endsAt) : "";
  const range = [from, to].filter(Boolean).join(" → ");
  return {
    text: range,
    className: "bg-muted text-muted-foreground",
  };
}

export function AdminExamsList({ exams }: AdminExamsListProps) {
  const [selectedBatch, setSelectedBatch] = useState<string>("all");

  const batches = useMemo(() => {
    const map = new Map<string, string>();
    for (const exam of exams) {
      for (const be of exam.batchExams) {
        if (be.batch) map.set(be.batch.id, be.batch.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [exams]);

  const filtered = useMemo(() => {
    if (selectedBatch === "all") return exams;
    if (selectedBatch === "unassigned")
      return exams.filter((e) => e.batchExams.length === 0);
    return exams.filter((e) =>
      e.batchExams.some((be) => be.batch?.id === selectedBatch),
    );
  }, [exams, selectedBatch]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filter row */}
      <div className="flex items-center gap-3">
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm flex-1 sm:flex-none sm:min-w-[200px]"
        >
          <option value="all">সব পরীক্ষা ({exams.length})</option>
          <option value="unassigned">
            কোনো ব্যাচে নেই (
            {exams.filter((e) => e.batchExams.length === 0).length})
          </option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} (
              {
                exams.filter((e) =>
                  e.batchExams.some((be) => be.batch?.id === b.id),
                ).length
              }
              )
            </option>
          ))}
        </select>
        {selectedBatch !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground shrink-0"
            onClick={() => setSelectedBatch("all")}
          >
            ক্লিয়ার
          </Button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-xl text-muted-foreground">
          কোনো পরীক্ষা পাওয়া যায়নি
        </div>
      ) : (
        <QuickList
          items={filtered.map((exam) => {
            const batchNames = [
              ...new Set(
                exam.batchExams.map((be) => be.batch?.name).filter(Boolean),
              ),
            ] as string[];

            const assignments: ExamScheduleAssignment[] = exam.batchExams
              .filter((be) => be.batch)
              .map((be) => ({
                batchExamId: be.id,
                batchId: be.batchId,
                batchName: be.batch?.name ?? "",
                startsAt: be.startsAt ?? null,
                endsAt: be.endsAt ?? null,
              }));

            // One chip summarising the window; with several batches each can
            // differ, so the chip says so instead of showing a single range.
            const schedule =
              assignments.length === 0
                ? null
                : assignments.length > 1
                  ? {
                      text: `${assignments.length} ব্যাচে ভিন্ন সময়`,
                      className:
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    }
                  : scheduleLabel(
                      assignments[0]?.startsAt,
                      assignments[0]?.endsAt,
                    );

            return {
              title: exam.title,
              description: [
                TYPE_LABELS[exam.type] ?? exam.type,
                `${exam.durationMinutes} মিনিট`,
                `${exam.totalMarks} নম্বর`,
                batchNames.length > 0
                  ? `ব্যাচ: ${batchNames.join(", ")}`
                  : "কোনো ব্যাচে নেই",
              ].join(" · "),
              icon: TaskSquare,
              iconBg: "bg-primary/10",
              text: "text-primary",
              extra: (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {exam.standard && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {exam.standard === "HSC"
                        ? "বোর্ড"
                        : exam.standard === "Varsity"
                          ? "ভার্সিটি"
                          : exam.standard === "Engineering"
                            ? "ইঞ্জিনিয়ারিং"
                            : exam.standard === "Medical"
                              ? "মেডিকেল"
                              : exam.standard}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      exam.isPublished
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {exam.isPublished ? "Published" : "Draft"}
                  </span>
                  {schedule && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${schedule.className}`}
                    >
                      {schedule.text}
                    </span>
                  )}
                </div>
              ),
              rightElement: (
                <div className="flex items-center gap-1">
                  {/* Schedule — icon on mobile */}
                  {assignments.length > 0 && (
                    <>
                      <ExamScheduleModal
                        examTitle={exam.title}
                        assignments={assignments}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg flex sm:hidden"
                            title="সময়সূচি"
                          >
                            <CalendarTick className="size-4" />
                          </Button>
                        }
                      />
                      <ExamScheduleModal
                        examTitle={exam.title}
                        assignments={assignments}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-xs h-8 px-3 hidden sm:flex"
                          >
                            সময়
                          </Button>
                        }
                      />
                    </>
                  )}

                  {/* Edit — icon on mobile */}
                  <ExamEditorModal
                    examId={exam.id}
                    examTitle={exam.title}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg flex sm:hidden"
                        title="এডিট"
                      >
                        <Edit className="size-4" />
                      </Button>
                    }
                  />
                  {/* Edit — text on sm+ */}
                  <ExamEditorModal
                    examId={exam.id}
                    examTitle={exam.title}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs h-8 px-3 hidden sm:flex"
                      >
                        এডিট
                      </Button>
                    }
                  />

                  {/* Questions */}
                  <Link href={`/admin/exams/${exam.id}/questions`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg flex sm:hidden"
                      title="প্রশ্ন"
                    >
                      <Clipboard className="size-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/${exam.id}/questions`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs h-8 px-3 hidden sm:flex"
                    >
                      প্রশ্ন
                    </Button>
                  </Link>

                  {/* Results */}
                  <Link href={`/admin/exams/${exam.id}/results`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg flex sm:hidden"
                      title="রেজাল্ট"
                    >
                      <Chart className="size-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/${exam.id}/results`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs h-8 px-3 hidden sm:flex"
                    >
                      রেজাল্ট
                    </Button>
                  </Link>
                </div>
              ),
            };
          })}
          columns={{ sm: 1, md: 1, lg: 1 }}
          gap="sm"
        />
      )}
    </div>
  );
}
