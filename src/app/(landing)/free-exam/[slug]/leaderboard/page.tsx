import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { FreeExamLeaderboardView } from "@/components/free-exam/free-exam-leaderboard-view";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import { getFreeExamLeaderboardAction } from "@/lib/actions/free-exam";


interface FreeExamLeaderboardPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export default async function FreeExamLeaderboardPage({
  params,
}: FreeExamLeaderboardPageProps): Promise<ReactElement> {
  const { slug } = await params;
  const res = await getFreeExamLeaderboardAction(slug);

  if (!res.success || !res.exam) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-6 sm:py-10 w-full">
        <FreeExamLeaderboardView
          slug={slug}
          exam={res.exam}
          leaderboard={res.leaderboard}
        />
      </main>

      <LandingFooter />
    </div>
  );
}
