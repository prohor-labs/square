"use client";

import { useMemo, useState } from "react";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toBengaliDigits } from "@/lib/calendar-date";

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

const ALL = "all";

/**
 * The bank with a course picker and an exam picker under it. Both start on
 * "সব" and the exam list narrows to the chosen course.
 */
export function WrongAnswersList({
  rows,
}: {
  readonly rows: readonly WrongAnswerRow[];
}) {
  const [course, setCourse] = useState(ALL);
  const [exam, setExam] = useState(ALL);

  const courses = useMemo(
    () => [...new Set(rows.map((r) => r.courseName).filter(Boolean))].sort(),
    [rows],
  );

  /* Exams come from whichever course is picked, so the list never offers a
     pairing that has no mistakes. */
  const exams = useMemo(() => {
    const inCourse =
      course === ALL ? rows : rows.filter((r) => r.courseName === course);
    return [
      ...new Set(inCourse.map((r) => r.examTitle).filter(Boolean)),
    ].sort();
  }, [rows, course]);

  const shown = rows.filter((r) => {
    if (course !== ALL && r.courseName !== course) return false;
    if (exam !== ALL && r.examTitle !== exam) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">কোর্স</span>
          <Select
            value={course}
            onValueChange={(value) => {
              setCourse(value ?? ALL);
              setExam(ALL);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="কোর্স নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">এক্সাম</span>
          <Select value={exam} onValueChange={(v) => setExam(v ?? ALL)}>
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="এক্সাম নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব</SelectItem>
              {exams.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {toBengaliDigits(shown.length)} টি প্রশ্ন দেখানো হচ্ছে
      </p>

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
