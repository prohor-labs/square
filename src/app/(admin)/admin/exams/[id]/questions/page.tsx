import { notFound } from "next/navigation";
import { ExamQuestionBuilder } from "@/components/admin/exam-question-builder";
import { getExamWithQuestionsAdmin } from "@/lib/actions/admin-exam";
import { getQuestionsAdminAction } from "@/lib/actions/question";
import { getFullQbHierarchy } from "@/lib/actions/universal-qb";

export default async function ExamQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch exam, initial questions, and full hierarchy in parallel
  const [{ success: examSuccess, data: exam }, questions, hierarchy] =
    await Promise.all([
      getExamWithQuestionsAdmin(id),
      getQuestionsAdminAction({ limit: 50 }),
      getFullQbHierarchy(),
    ]);

  if (!examSuccess || !exam) return notFound();

  return (
    <ExamQuestionBuilder
      exam={exam}
      questions={questions || []}
      hierarchy={hierarchy || []}
    />
  );
}
