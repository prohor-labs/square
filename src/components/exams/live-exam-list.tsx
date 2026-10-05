"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveExamCard } from "@/components/exams/live-exam-card";
import { Clock } from "@/components/icons";
import { getExamWindow } from "@/lib/exam-window";
import type { BatchExamDetail } from "@/types";

interface LiveExamListProps {
  readonly batchExams: readonly BatchExamDetail[];
}

/**
 * Client wrapper so the "time left" chip on every live card ticks from one
 * shared interval instead of one per card.
 */
export function LiveExamList({ batchExams }: LiveExamListProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Only exams that are live right now appear in this section.
  const live = useMemo(
    () =>
      batchExams.filter(
        (be) => getExamWindow(be, now ?? Date.now()).status === "live",
      ),
    [batchExams, now],
  );

  const batchOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const be of batchExams) {
      if (be.batch) seen.set(be.batch.id, be.batch.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [batchExams]);

  if (live.length === 0) {
    return (
      <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl text-muted-foreground bg-muted/10 px-4 sm:px-6">
        <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-3">
          <Clock className="size-6 text-muted-foreground" />
        </div>
        <p className="font-bold text-base sm:text-lg text-foreground">
          এই মুহূর্তে কোনো লাইভ পরীক্ষা চলছে না
        </p>
        <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
          নির্ধারিত সময় শুরু হলে এখানে লাইভ পরীক্ষা দেখতে পাবেন। সময় পেরিয়ে গেলে সেটি
          প্র্যাকটিস হিসেবে চলে যাবে।
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {live.map((be) => (
        <LiveExamCard
          key={be.id}
          batchExam={be}
          window={getExamWindow(be, now ?? Date.now())}
          now={now}
          batchOptions={batchOptions}
        />
      ))}
    </div>
  );
}
