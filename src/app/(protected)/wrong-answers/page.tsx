import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { Danger } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import { getWrongAnswers } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** Questions the student answered wrongly, for a second pass. */
export default async function WrongAnswersPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const rows = userId ? await getWrongAnswers(userId) : [];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          ভুল ব্যাংক
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {toBengaliDigits(rows.length)} টি প্রশ্ন ভুল হয়েছে — একবার আর পড়ুন
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-primary">
            <Danger className="size-7" />
          </div>
          <p className="text-lg font-bold">ভুল ব্যাংক খালি</p>
          <p className="max-w-md text-xs text-muted-foreground md:text-sm">
            পরীক্ষা দিলে যে প্রশ্নগুলো ভুল হবে, সেগুলো এখানে জমা হবে।
          </p>
          <Link href="/exams">
            <Button className="rounded-xl px-6 font-semibold">পরীক্ষা দিন</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <UniversalQuestionCard
              key={row.question.id}
              question={{
                id: row.question.id,
                type: row.question.type,
                source: row.question.source,
                standard: row.question.standard,
                questionText: row.question.questionText,
                explanation: row.question.explanation,
                isFree: row.question.isFree,
                mcqOptions: row.options,
              }}
              showCorrectAnswer
              badgeText={row.examTitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
