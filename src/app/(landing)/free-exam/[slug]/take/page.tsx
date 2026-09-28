import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";
import { FreeExamTakingRoom } from "@/components/free-exam/free-exam-taking-room";
import { LandingHeader } from "@/components/landing-nav";
import { getFreeExamQuestionsForTakingAction } from "@/lib/actions/free-exam";


interface FreeExamTakePageProps {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams: Promise<{ readonly submissionId?: string }>;
}

export default async function FreeExamTakePage({
  params,
  searchParams,
}: FreeExamTakePageProps): Promise<ReactElement> {
  const { slug } = await params;
  const { submissionId } = (await searchParams) || {};

  if (!submissionId) {
    redirect(`/free-exam/${slug}`);
  }

  const res = await getFreeExamQuestionsForTakingAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const { exam, questions } = res.data;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-4 sm:py-6 w-full">
        <FreeExamTakingRoom
          exam={exam}
          questions={questions}
          submissionId={submissionId}
        />
      </main>
    </div>
  );
}
