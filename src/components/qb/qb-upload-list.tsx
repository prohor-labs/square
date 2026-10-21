import type { ReactElement } from "react";
import { QbQuestionActions } from "@/components/qb/qb-question-actions";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import type { QbUploadedQuestion } from "@/lib/actions/qb-uploads";

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
 * Read-only view of everything uploaded from /qb, newest first.
 *
 * The card is the same one students see in an exam, opened up so the correct
 * options and the explanation are visible straight away.
 */
export function QbUploadList({
  questions,
}: {
  readonly questions: readonly QbUploadedQuestion[];
}): ReactElement {
  return (
    <ol className="flex flex-col gap-4">
      {questions.map((item, index) => (
        <li key={item.id} className="flex flex-col gap-2">
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
            <span className="ml-auto">{formatDate(item.createdAt)}</span>
            <QbQuestionActions question={item} />
          </div>

          <UniversalQuestionCard
            question={{
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
            }}
            questionIndex={index}
            showCorrectAnswer
            disableOptionChange
          />
        </li>
      ))}
    </ol>
  );
}
