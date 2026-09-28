"use client";

import Link from "next/link";
import { useState } from "react";
import { ExamScoreCard } from "@/components/exams/exam-score-card";
import {
  ArrowLeft2,
  BookOpen,
  CloseCircle,
  StatusUp,
  TickCircle,
} from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types";

interface ExamResultResponse {
  id: string;
  isCorrect: boolean;
  selectedOptionId?: string | null;
  cqAnswerText?: string | null;
  examQuestion?: {
    marks: number;
    question?: Question | null;
  } | null;
}

interface ExamResultSubmission {
  score: string;
  totalMarks: number;
  timeTakenSeconds: number;
  exam?: {
    title: string;
    negativeMarking: string;
  } | null;
  responses?: ExamResultResponse[];
}

interface ExamResultViewProps {
  submission: ExamResultSubmission;
  slug: string;
}

export function ExamResultView({ submission, slug }: ExamResultViewProps) {
  const exam = submission.exam;
  const responses = submission.responses || [];

  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const r of responses) {
        if (r.examQuestion?.question?.id) {
          initial[r.examQuestion.question.id] = true;
        }
      }
      return initial;
    },
  );

  const scoreNum = parseFloat(submission.score || "0");
  const totalMarks = submission.totalMarks || 1;
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((scoreNum / totalMarks) * 100)),
  );

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit,
    );
  };

  const formatTimeBangla = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${toBanglaDigits(h)} ঘণ্টা ${toBanglaDigits(m)} মিনিট ${toBanglaDigits(s)} সেকেন্ড`;
    if (m > 0) return `${toBanglaDigits(m)} মিনিট ${toBanglaDigits(s)} সেকেন্ড`;
    return `${toBanglaDigits(s)} সেকেন্ড`;
  };

  const correctCount = responses.filter((r) => r.isCorrect).length;
  const incorrectCount = responses.filter(
    (r) => !r.isCorrect && r.selectedOptionId,
  ).length;
  const unattemptedCount = responses.filter(
    (r) => !r.selectedOptionId && !r.cqAnswerText?.trim(),
  ).length;

  const toggleSolution = (qId: string) => {
    setOpenSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16 sm:pb-24 pt-0 sm:pt-2 md:pt-4 gap-6 sm:gap-8 px-3 sm:px-6">
      {/* Main Scorecard Banner */}
      <div className="border border-border/70 rounded-2xl sm:rounded-3xl p-6 sm:p-10 bg-card shadow-xs flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-1 max-w-md">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            {exam?.title || "পরীক্ষার ফলাফল"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            আপনার পরীক্ষা মূল্যায়নের পূর্ণাঙ্গ রিপোর্ট নিচে দেওয়া হলো
          </p>
        </div>

        {/* Score Ring & Stats */}
        <ExamScoreCard
          scoreNum={scoreNum}
          totalMarks={totalMarks}
          percentage={percentage}
          timeTakenSeconds={submission.timeTakenSeconds || 0}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          unattemptedCount={unattemptedCount}
          toBanglaDigits={toBanglaDigits}
          formatTimeBangla={formatTimeBangla}
        />

        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-md">
          <Button
            render={<Link href={`/exams/${slug}/leaderboard`} />}
            variant="outline"
            className="flex-1 rounded-xl font-bold h-11 text-xs sm:text-sm"
          >
            <StatusUp className="size-4 mr-2" /> লিডারবোর্ড দেখুন
          </Button>
          <Button
            render={<Link href="/exams" />}
            className="flex-1 rounded-xl font-bold h-11 text-xs sm:text-sm shadow-xs"
          >
            <ArrowLeft2 className="size-4 mr-2" /> সকল পরীক্ষা
          </Button>
        </div>
      </div>

      {/* Detailed Question Review Section */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            প্রশ্নের বিস্তারিত পর্যালোচনা ও সমাধান
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            মোট {toBanglaDigits(responses.length)} টি প্রশ্ন
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          {responses.map((resp, idx) => {
            const question = resp.examQuestion?.question;
            if (!question) return null;

            const isCq = question.type === "cq";
            const isCorrect = Boolean(resp.isCorrect);
            const isAttempted = Boolean(
              resp.selectedOptionId || resp.cqAnswerText?.trim(),
            );

            return (
              <div key={resp.id} className="flex flex-col gap-2">
                <UniversalQuestionCard
                  question={question}
                  questionIndex={idx}
                  selectedOptionId={resp.selectedOptionId ?? undefined}
                  showCorrectAnswer={true}
                  isSolutionOpen={Boolean(openSolutions[question.id])}
                  onToggleSolution={toggleSolution}
                  badgeText={`প্রশ্ন ${toBanglaDigits(idx + 1)}`}
                  footerActions={
                    <div className="flex items-center gap-2">
                      {!isAttempted ? (
                        <span className="text-xs text-muted-foreground font-semibold">
                          উত্তর দেওয়া হয়নি
                        </span>
                      ) : isCorrect ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                          <TickCircle className="size-3.5 shrink-0" />
                          <span>
                            সঠিক উত্তর (+
                            {toBanglaDigits(resp.examQuestion?.marks || 1)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-destructive font-bold inline-flex items-center gap-1">
                          <CloseCircle className="size-3.5 shrink-0" />
                          <span>
                            ভুল উত্তর (-
                            {toBanglaDigits(exam?.negativeMarking || 0)})
                          </span>
                        </span>
                      )}
                    </div>
                  }
                />

                {/* If CQ, display user's submitted text and feedback */}
                {isCq && resp.cqAnswerText && (
                  <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      আপনার জমা দেওয়া উত্তর:
                    </span>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 p-3 rounded-xl border border-border/50">
                      {resp.cqAnswerText}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
