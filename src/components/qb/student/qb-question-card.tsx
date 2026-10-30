"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight2 } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import type { QbUploadedQuestion } from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { Question } from "@/types";

export interface QbQuestionCardProps {
  /** 1-based number as the student should see it. */
  readonly index: number;
  readonly question: QbUploadedQuestion;
  /** Hide the "open page" link when this card already is that page. */
  readonly showPermalink?: boolean;
  readonly examLabel?: string;
}

/**
 * One question in the student's list.
 *
 * The heavy renderer (`UniversalQuestionCard`) is the same one exams use, so
 * KaTeX, images and option styling stay identical everywhere. Mapping happens
 * here instead of in the page so the server component can stay serializable.
 */
export function QbQuestionCard({
  index,
  question,
  showPermalink = true,
  examLabel,
}: QbQuestionCardProps): React.ReactElement {
  const mapped = useMemo<Question>(
    () => ({
      id: question.id,
      type: question.type,
      source: question.source,
      standard: question.standard,
      questionText: question.questionText,
      questionImage: question.questionImage,
      explanation: question.explanation,
      explanationImage: question.explanationImage,
      topicId: question.topicId,
      mcqOptions: question.mcqOptions.map((option) => ({
        id: option.id,
        questionId: question.id,
        optionText: option.optionText,
        image: option.image,
        isCorrect: option.isCorrect,
        orderNo: option.orderNo,
      })),
      cqParts: question.cqParts.map((part) => ({
        id: part.id,
        questionId: question.id,
        partKey: part.partKey as "a" | "b" | "c" | "d",
        questionText: part.questionText,
        answerText: part.answerText,
        marks: part.marks,
        orderNo: part.orderNo,
      })),
    }),
    [question],
  );

  const shelf = question.shelves[0];
  const badge = examLabel
    ? examLabel
    : [
        shelf?.university,
        shelf?.unit,
        shelf?.year ? toBengaliDigits(shelf.year) : "",
      ]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(" · ");

  /** Book → chapter → topic, always on the right and always small. */
  const context = [
    question.subjectName ? `বই: ${question.subjectName}` : "",
    question.chapterName ? `অধ্যায়: ${question.chapterName}` : "",
    question.topicName ? `টপিক: ${question.topicName}` : "",
  ].filter((part) => part.length > 0);

  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span className="rounded-md bg-muted px-2 py-0.5 font-bold text-foreground/90">
            প্রশ্ন {toBengaliDigits(index)}
          </span>
          {badge ? (
            <span className="rounded-full bg-primary/12 px-2 py-0.5 font-bold text-primary">
              {badge}
            </span>
          ) : null}
        </div>

        {context.length > 0 ? (
          <p className="min-w-0 text-[10px] font-medium leading-relaxed text-muted-foreground sm:text-right sm:text-[11px]">
            {context.join(" · ")}
          </p>
        ) : null}
      </div>

      <UniversalQuestionCard
        question={mapped}
        questionIndex={index - 1}
        showCorrectAnswer={true}
        disableOptionChange={true}
      />

      {showPermalink ? (
        <Link
          href={`/qb/question/${question.id}${shelf ? `?set=${encodeURIComponent(shelf.setId)}` : ""}`}
          className="inline-flex items-center gap-1 self-start text-[11px] font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          আলাদা পেজে খুলুন
          <ArrowRight2 className="size-3" aria-hidden="true" />
        </Link>
      ) : null}
    </li>
  );
}
