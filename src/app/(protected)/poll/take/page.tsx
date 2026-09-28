"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { usePollStore } from "@/hooks/usePollStore";
import type { Question } from "@/types";
export default function PollTakePage() {
  const router = useRouter();
  const {
    item,
    standard,
    activeQuestions,
    userAnswers,
    currentQuestionIndex,
    setUserAnswers,
    setCurrentQuestionIndex,
  } = usePollStore();

  useEffect(() => {
    if (activeQuestions.length === 0) {
      router.replace("/poll/config");
    }
  }, [activeQuestions.length, router]);

  useEffect(() => {
    if (
      activeQuestions.length > 0 &&
      currentQuestionIndex >= activeQuestions.length
    ) {
      router.replace("/poll/solve");
    }
  }, [currentQuestionIndex, activeQuestions.length, router]);

  if (
    activeQuestions.length === 0 ||
    currentQuestionIndex >= activeQuestions.length
  ) {
    return null;
  }

  const handleSelectAnswer = (_qId: string, optId: string) => {
    if (userAnswers[currentQuestionIndex] !== undefined) return;
    const optIdx = parseInt(optId, 10);
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optIdx }));

    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
    }, 800);
  };

  const answeredCount = Object.keys(userAnswers).length;
  let correctCount = 0;
  activeQuestions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIdx) {
      correctCount++;
    }
  });

  const rawQ = activeQuestions[currentQuestionIndex];
  const adaptedQ: Question = {
    id: `poll-${currentQuestionIndex}`,
    type: "mcq",
    source: standard || "Poll",
    standard: "HSC",
    questionText: rawQ.question,
    explanation: rawQ.explanation,
    mcqOptions: rawQ.options.map((opt, idx) => ({
      id: String(idx),
      optionText: opt,
      isCorrect: idx === rawQ.correctIdx,
      orderNo: idx + 1,
    })),
  };

  const selectedOptId =
    userAnswers[currentQuestionIndex] !== undefined
      ? String(userAnswers[currentQuestionIndex])
      : undefined;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-3xl mx-auto w-full">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between bg-card border border-border/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 shadow-xs">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <span className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {item || "পোল অনুশীলন"}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            প্রশ্ন {currentQuestionIndex + 1} / {activeQuestions.length}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground block uppercase font-bold">
              সম্পন্ন
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground">
              {answeredCount}/{activeQuestions.length}
            </span>
          </div>
          <div className="h-6 sm:h-8 w-px bg-border" />
          <div className="text-center">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground block uppercase font-bold">
              সঠিক উত্তর
            </span>
            <span className="text-xs sm:text-sm font-bold text-primary">
              {correctCount}টি
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <UniversalQuestionCard
          question={adaptedQ}
          questionIndex={currentQuestionIndex}
          selectedOptionId={selectedOptId}
          onSelectOption={handleSelectAnswer}
          hideExplanation={true}
          hideControls={true}
        />
      </div>
    </div>
  );
}
