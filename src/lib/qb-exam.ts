import type { QbUploadedQuestion } from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbExamPool } from "@/lib/qb-catalog";
import {
  CUSTOM_EXAM_MAX_QUESTIONS,
  CUSTOM_EXAM_NEGATIVE,
  type CustomExam,
  type CustomExamQuestion,
  type CustomExamRequest,
} from "@/lib/qb-exam-types";

/**
 * The custom exam: a practice paper built from the uploaded question bank.
 *
 * Nothing is stored. The browser asks for a paper, keeps it in memory, scores
 * it locally and throws it away, so no login, submission row or result table is
 * involved. The only server work is picking the questions.
 */

/** A flat integer between `min` and `max`, falling back to `fallback`. */
function bounded(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.trunc(number), min), max);
}

/** Only a question with at least two options and one answer can be scored. */
function isPlayable(question: QbUploadedQuestion): boolean {
  return (
    question.type === "mcq" &&
    question.mcqOptions.length >= 2 &&
    question.mcqOptions.some((option) => option.isCorrect)
  );
}

/** Fisher–Yates on a copy; the pool stays untouched. */
function shuffle<T>(list: readonly T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function toExamQuestion(question: QbUploadedQuestion): CustomExamQuestion {
  const shelf = question.shelves[0];
  const context = [
    shelf?.university,
    shelf?.unit,
    shelf?.year ? toBengaliDigits(shelf.year) : null,
    question.subjectName,
    question.paperName,
    question.chapterName,
    question.topicName,
  ].filter((part): part is string => Boolean(part?.trim()));

  return {
    id: question.id,
    text: question.questionText,
    image: question.questionImage,
    explanation: question.explanation,
    explanationImage: question.explanationImage,
    options: question.mcqOptions
      .slice()
      .sort((a, b) => a.orderNo - b.orderNo)
      .map((option) => ({
        id: option.id,
        text: option.optionText,
        image: option.image,
        isCorrect: option.isCorrect,
      })),
    context,
  };
}

/**
 * Picks a paper from the bank for the chosen filters.
 *
 * Returns `null` when the filters land on nothing — the form then tells the
 * student to widen the choice instead of starting an empty exam.
 */
export async function buildCustomExam(
  request: CustomExamRequest,
): Promise<CustomExam | null> {
  const pool = await getQbExamPool({
    section: request.section,
    group: request.group,
    year: request.year,
    subjectId: request.subjectId,
    chapterId: request.chapterId,
    topicId: request.topicId,
  });

  const playable = pool.filter(isPlayable);
  if (playable.length === 0) return null;

  const count = bounded(
    request.count,
    Math.min(10, playable.length),
    1,
    Math.min(CUSTOM_EXAM_MAX_QUESTIONS, playable.length),
  );

  const picked = shuffle(playable).slice(0, count);
  const minutes = bounded(request.minutes, Math.max(picked.length, 5), 1, 180);
  const negative = CUSTOM_EXAM_NEGATIVE.includes(
    Number(request.negative) as (typeof CUSTOM_EXAM_NEGATIVE)[number],
  )
    ? Number(request.negative)
    : 0;

  return {
    minutes,
    negative,
    questions: picked.map(toExamQuestion),
  };
}
