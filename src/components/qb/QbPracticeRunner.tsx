"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AngleLeft, AngleRight } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QbQuestionRow } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/**
 * Answer one, see the answer, move on.
 *
 * Not an exam: no timer, no score, no pressure. The point of practising is to
 * find out what you did not know, and a countdown only gets in the way of that.
 */
export function QbPracticeRunner({
  questions,
}: {
  questions: readonly QbQuestionRow[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [wrong, setWrong] = useState<readonly string[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[Math.min(index, questions.length - 1)];
  const answered = picked !== undefined;
  const done = index + 1 >= questions.length;

  const options = useMemo(
    () => question?.options.map((o) => o.id) ?? [],
    [question],
  );

  const choose = (optionId: string) => {
    // Locked in: changing the answer after seeing the result teaches nothing.
    if (answered) return;
    const option = question.options.find((o) => o.id === optionId);
    if (!option?.isCorrect) {
      setWrong((current) =>
        current.includes(question.id) ? current : [...current, question.id],
      );
    }
    setPicked(optionId);
  };

  const next = () => {
    if (done) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(undefined);
  };

  const restart = () => {
    setIndex(0);
    setPicked(undefined);
    setWrong([]);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
        <p className="text-sm font-bold text-foreground">
          এই ফিল্টারে অনুশীলনের মতো প্রশ্ন নেই
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          অন্য বিষয় বা সাল বেছে নিন।
        </p>
      </div>
    );
  }

  if (finished) {
    const right = questions.length - wrong.length;
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-bold text-foreground">অনুশীলন শেষ</p>
        <p className="text-2xl font-black text-primary tabular-nums">
          {toBengaliDigits(right)} / {toBengaliDigits(questions.length)}
        </p>
        <p className="text-xs text-muted-foreground">
          {wrong.length === 0
            ? "সবগুলো ঠিক উত্তর দিয়েছ।"
            : `${toBengaliDigits(wrong.length)} টি প্রশ্ন আবার দেখা ভালো হবে।`}
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={restart}
            className="cursor-pointer"
          >
            আবার শুরু
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/qb")}
            className="cursor-pointer"
          >
            প্রশ্নব্যাংকে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-muted-foreground tabular-nums">
          {toBengaliDigits(index + 1)} / {toBengaliDigits(questions.length)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={restart}
          className="h-7 cursor-pointer px-2 text-xs text-muted-foreground"
        >
          আবার শুরু
        </Button>
      </div>

      <Progress
        value={((index + (answered ? 1 : 0)) / questions.length) * 100}
      />

      <UniversalQuestionCard
        question={{
          id: question.id,
          type: question.type,
          source: question.source,
          standard: "HSC",
          questionText: question.questionText,
          explanation: question.explanation,
          isFree: question.isFree,
          mcq_options: question.options.map((o) => ({
            id: o.id,
            optionText: o.text,
            isCorrect: o.isCorrect,
            orderNo: 0,
          })),
        }}
        selectedOptionId={picked}
        showCorrectAnswer={answered}
        disableOptionChange={answered}
        onSelectOption={(_id, optionId) => choose(optionId)}
        // The card would show the answer as soon as one was tapped, which is the
        // opposite of practising; the reveal is the Next button's job.
        hideControls
        footerActions={
          <div className="flex w-full items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              onClick={next}
              disabled={options.length > 0 && !answered}
              className="cursor-pointer"
            >
              {done ? "ফলাফল দেখুন" : "পরের প্রশ্ন"}
              <AngleRight className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        }
      />

      <p
        className={cn(
          "text-center text-xs",
          answered ? "text-muted-foreground" : "text-muted-foreground/70",
        )}
      >
        {options.length === 0
          ? "লিখিত প্রশ্ন — উত্তর নিজে লিখে নিচের বোতামে যান।"
          : answered
            ? "উত্তর দেখা হয়েছে। সব উত্তর খুলতে উপরে 'সমাধান' চাপুন।"
            : "একটি উত্তর বেছে নিন।"}
      </p>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setPicked(undefined);
          }}
          disabled={index === 0}
          className="cursor-pointer"
        >
          <AngleLeft className="size-4" data-icon="inline-start" />
          আগেরটি
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={restart}
          className="cursor-pointer text-muted-foreground"
        >
          বাতিল করুন
        </Button>
      </div>
    </div>
  );
}
