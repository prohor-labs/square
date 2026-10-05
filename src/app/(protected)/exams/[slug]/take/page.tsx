import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LiveExamView } from "@/components/exams/live-exam-view";
import { db } from "@/db";
import { batchExams, examSubmissions } from "@/db/schema";
import { getExamBySlug } from "@/lib/actions/exam";
import { auth } from "@/lib/auth";
import { getExamWindow } from "@/lib/exam-window";

export default async function TakeExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sid: string }>;
}) {
  const { slug } = await params;
  const { sid } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return redirect("/login");

  if (!sid) return redirect(`/exams/${slug}`);

  // Validate submission
  const submission = await db.query.examSubmissions.findFirst({
    where: and(
      eq(examSubmissions.id, sid),
      eq(examSubmissions.userId, session.user.id),
    ),
  });

  if (!submission) return notFound();

  if (submission.status !== "in_progress") {
    return redirect(`/exams/${slug}/result?sid=${sid}`);
  }

  // Fetch full exam structure
  const { success, data: exam } = await getExamBySlug(slug);

  if (!success || !exam) return notFound();

  // Calculate elapsed time based on startedAt
  // We'll pass the remaining time to the client component
  const startedAtMs = new Date(submission.startedAt).getTime();
  const nowMs = Date.now();
  const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);

  const totalSeconds = exam.durationMinutes * 60;
  let initialTimeLeft = Math.max(0, totalSeconds - elapsedSeconds);

  // A live attempt cannot outlive the scheduled window, so clamp to whichever
  // runs out first: the exam duration or the window's end.
  if (submission.batchExamId) {
    const scheduled = await db.query.batchExams.findFirst({
      where: eq(batchExams.id, submission.batchExamId),
    });
    if (scheduled) {
      const window = getExamWindow(scheduled);
      if (window.status === "live" && window.endsAt) {
        const windowSecondsLeft = Math.floor(
          (window.endsAt.getTime() - nowMs) / 1000,
        );
        initialTimeLeft = Math.max(
          0,
          Math.min(initialTimeLeft, windowSecondsLeft),
        );
      }
    }
  }

  // If time is up, client component will handle auto-submit on mount

  return (
    <LiveExamView
      exam={exam}
      submissionId={sid}
      initialTimeLeft={initialTimeLeft}
    />
  );
}
