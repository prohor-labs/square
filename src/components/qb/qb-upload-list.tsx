"use client";

import { memo, type ReactElement, useMemo } from "react";
import { QbQuestionActions } from "@/components/qb/qb-question-actions";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import type { QbUploadedQuestion } from "@/lib/actions/qb-uploads";
import type { Question } from "@/types";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return date.toLocaleString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * The cards are heavy (markdown + KaTeX), so memoize the card itself. Filtering
 * then only changes the `hidden` flag on the row; it never re-renders the math.
 */
const MemoQuestionCard = memo(UniversalQuestionCard);

const QbUploadListItem = memo(function QbUploadListItem({
  item,
  index,
  hidden,
  showActions,
}: {
  readonly item: QbUploadedQuestion;
  readonly index: number;
  readonly hidden: boolean;
  readonly showActions: boolean;
}): ReactElement {
  const question = useMemo<Question>(
    () => ({
      id: item.id,
      type: item.type,
      source: item.source,
      standard: item.standard,
      questionText: item.questionText,
      questionImage: item.questionImage,
      explanation: item.explanation,
      explanationImage: item.explanationImage,
      mcqOptions: item.mcqOptions.map((option) => ({
        id: option.id,
        optionText: option.optionText,
        image: option.image,
        isCorrect: option.isCorrect,
        orderNo: option.orderNo,
      })),
      cqParts: item.cqParts.map((part) => ({
        id: part.id,
        partKey: (["a", "b", "c", "d"].includes(part.partKey)
          ? part.partKey
          : "a") as "a" | "b" | "c" | "d",
        questionText: part.questionText,
        answerText: part.answerText,
        marks: part.marks,
        orderNo: part.orderNo,
      })),
    }),
    [item],
  );
  const date = useMemo(() => formatDate(item.createdAt), [item.createdAt]);

  return (
    <li className={hidden ? "hidden" : "flex flex-col gap-2"}>
      <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-0.5 font-bold text-foreground">
          {item.subjectName}
        </span>
        <span>{item.chapterName}</span>
        {item.topicName ? (
          <>
            <span aria-hidden="true">›</span>
            <span>{item.topicName}</span>
          </>
        ) : null}
        <span className="ml-auto">{date}</span>
        {showActions ? <QbQuestionActions question={item} /> : null}
      </div>

      <MemoQuestionCard
        question={question}
        questionIndex={index}
        showCorrectAnswer
        disableOptionChange
      />
    </li>
  );
});

/**
 * Read-only view of everything uploaded from /qb, newest first.
 *
 * When `visibleIds` is provided the full list stays mounted (only the hidden
 * flag changes), which makes subject/chapter/topic filtering instant.
 */
export function QbUploadList({
  questions,
  visibleIds,
  showActions = true,
}: {
  readonly questions: readonly QbUploadedQuestion[];
  readonly visibleIds?: ReadonlySet<string>;
  readonly showActions?: boolean;
}): ReactElement {
  return (
    <ol className="flex flex-col gap-4">
      {questions.map((item, index) => (
        <QbUploadListItem
          key={item.id}
          item={item}
          index={index}
          hidden={visibleIds ? !visibleIds.has(item.id) : false}
          showActions={showActions}
        />
      ))}
    </ol>
  );
}
