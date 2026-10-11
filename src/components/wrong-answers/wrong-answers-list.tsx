"use client";

import { useMemo, useState } from "react";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { cn } from "@/lib/utils";

export interface WrongAnswerRow {
  readonly id: string;
  readonly examTitle: string;
  readonly courseName: string;
  readonly question: {
    readonly type: "mcq" | "cq";
    readonly source: string;
    readonly standard: string;
    readonly questionText: string;
    readonly explanation: string | null;
    readonly isFree: boolean;
  };
  readonly options: readonly {
    readonly id: string;
    readonly optionText: string;
    readonly isCorrect: boolean;
  }[];
}

/**
 * The bank with a course picker. One question shows once even when it was
 * missed in several exams — the same rule the query applies.
 */
export function WrongAnswersList({
  rows,
}: {
  readonly rows: readonly WrongAnswerRow[];
}) {
  const [course, setCourse] = useState("all");

  const courses = useMemo(
    () => [...new Set(rows.map((r) => r.courseName).filter(Boolean))].sort(),
    [rows],
  );

  const shown =
    course === "all" ? rows : rows.filter((r) => r.courseName === course);

  const options = [
    { name: "সব কোর্স", count: rows.length },
    ...courses.map((c) => ({
      name: c,
      count: rows.filter((r) => r.courseName === c).length,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={() => setCourse(option.name)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                course === option.name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {option.name} ({option.count})
            </button>
          ))}
        </div>
      )}

      {shown.map((row) => (
        <UniversalQuestionCard
          key={row.id}
          question={{
            id: row.id,
            type: row.question.type,
            source: row.question.source,
            standard: row.question.standard,
            questionText: row.question.questionText,
            explanation: row.question.explanation,
            isFree: row.question.isFree,
            mcqOptions: row.options,
          }}
          showCorrectAnswer
          badgeText={`${row.courseName || "সাধারণ"} · ${row.examTitle}`}
        />
      ))}
    </div>
  );
}
