import { headers } from "next/headers";
import { ExamsClientView } from "@/components/exams/exams-client-view";
import { getPublishedExams, getStudentExams } from "@/lib/actions/exam";
import { auth } from "@/lib/auth";

export default async function ExamsBrowserPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab } = (await searchParams) || {};
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [studentExamsRes, publishedExamsRes] = await Promise.all([
    userId ? getStudentExams(userId) : Promise.resolve({ data: [] }),
    getPublishedExams(),
  ]);

  const batchExams = studentExamsRes.data || [];
  const practiceExams = publishedExamsRes.data || [];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-16 sm:pb-24 pt-0 gap-6 font-sans">
      <ExamsClientView
        batchExams={batchExams}
        practiceExams={practiceExams}
        defaultTab={tab}
      />
    </div>
  );
}
