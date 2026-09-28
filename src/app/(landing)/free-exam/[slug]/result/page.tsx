import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";
import { FreeExamResultView } from "@/components/free-exam/free-exam-result-view";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import { getFreeExamResultAction } from "@/lib/actions/free-exam";


interface FreeExamResultPageProps {
  readonly params: Promise<{ readonly slug: string }>;
  readonly searchParams: Promise<{ readonly id?: string }>;
}

export default async function FreeExamResultPage({
  params,
  searchParams,
}: FreeExamResultPageProps): Promise<ReactElement> {
  const { slug } = await params;
  const { id: submissionId } = (await searchParams) || {};

  if (!submissionId) {
    redirect(`/free-exam/${slug}`);
  }

  const res = await getFreeExamResultAction(submissionId);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-6 sm:py-10 w-full">
        <FreeExamResultView slug={slug} resultData={res.data} />
      </main>

      <LandingFooter />
    </div>
  );
}
