"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BatchExamEditModal } from "@/components/admin/batch-exam-edit-modal";
import { QuickList } from "@/components/admin/quick-list";
import { TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { assignExamToBatchAction } from "@/lib/actions/batch";
import { formatBanglaDateTime } from "@/lib/date";
import type { BatchExamDetail } from "@/types";

interface BatchExamsTabProps {
  batchId: string;
  batchExams: readonly BatchExamDetail[];
}

export function BatchExamsTab({ batchId, batchExams }: BatchExamsTabProps) {
  const router = useRouter();
  const [examId, setExamId] = useState("");
  const [isAssigningExam, setIsAssigningExam] = useState(false);

  async function handleAssignExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examId) return;
    setIsAssigningExam(true);
    try {
      await assignExamToBatchAction(batchId, examId);
      setExamId("");
      router.refresh();
    } finally {
      setIsAssigningExam(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAssignExam}
        className="flex gap-3 items-end p-4 border rounded-xl bg-card"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="examId" className="text-sm font-medium">
            পরীক্ষার আইডি দিয়ে যুক্ত করুন
          </label>
          <Input
            id="examId"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            placeholder="পরীক্ষার আইডি লিখুন"
            className="rounded-xl"
          />
        </div>
        <Button type="submit" className="rounded-xl" disabled={isAssigningExam}>
          {isAssigningExam ? (
            <>
              <Spinner className="size-4 mr-2" /> যুক্ত হচ্ছে...
            </>
          ) : (
            "পরীক্ষা যুক্ত করুন"
          )}
        </Button>
      </form>

      <div className="mt-4">
        {!batchExams || batchExams.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-xl text-muted-foreground bg-card">
            কোনো পরীক্ষা যুক্ত করা হয়নি।
          </div>
        ) : (
          <QuickList
            items={batchExams.map((be) => ({
              title: be.exam?.title || "অজানা",
              description: `সময়সূচি: ${be.startsAt ? formatBanglaDateTime(be.startsAt) : "যেকোনো সময়"} — ${be.endsAt ? formatBanglaDateTime(be.endsAt) : "যেকোনো সময়"}`,
              icon: TaskSquare,
              iconBg: "bg-primary/10",
              text: "text-primary",
              rightElement: (
                <BatchExamEditModal
                  batchExam={{
                    ...be,
                    batchId,
                  }}
                />
              ),
            }))}
            columns={{ sm: 1, md: 2 }}
            gap="md"
          />
        )}
      </div>
    </div>
  );
}
