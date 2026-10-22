import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ArrowLeft2, FileText } from "@/components/icons";
import { QbUploadList } from "@/components/qb/qb-upload-list";
import { getCachedSession } from "@/lib/auth-session";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbFileWithQuestions } from "@/lib/qb-bank";

/**
 * One uploaded file with its questions.
 *
 * Served from two URLs: `/qb/file/<setId>` (the canonical link used in the
 * UI) and the older `/qb/<setId>`. The older path used to be swallowed by a
 * permanent (308) redirect in `next.config.ts`; browsers cache those forever,
 * so links must never go back to that shape.
 */
export async function QbFilePage({
  setId,
}: {
  readonly setId: string;
}): Promise<ReactElement> {
  const data = await getQbFileWithQuestions(setId);

  if (!data) notFound();

  const { file, questions } = data;

  /* Only admins may change a question; the server actions enforce this too. */
  const session = await getCachedSession();
  const canManage = session?.user?.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-16 pt-2 md:py-8">
      <nav
        aria-label="ব্রেডক্রাম"
        className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm"
      >
        <Link
          href="/qb"
          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
        >
          <ArrowLeft2 className="size-3.5" />
          প্রশ্নব্যাংক
        </Link>
        <span aria-hidden="true">›</span>
        <span className="truncate">{file.fileName}</span>
      </nav>

      <header className="rounded-3xl border bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              প্রশ্ন ফাইল
            </p>
            <h1 className="mt-0.5 text-xl font-black sm:text-2xl">
              {file.fileName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">
                {file.university || "সাধারণ"}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">
                {file.year ? toBengaliDigits(file.year) : "বছর নেই"}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">
                {file.unit || "ইউনিট নেই"}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">
                {toBengaliDigits(questions.length)} টি প্রশ্ন
              </span>
            </div>
          </div>
        </div>
      </header>

      {questions.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-bold">এই ফাইলে কোনো প্রশ্ন নেই</p>
        </div>
      ) : (
        <>
          {canManage ? (
            <p className="text-[11px] font-semibold text-muted-foreground">
              প্রতিটি প্রশ্নের পাশে সম্পাদনা ও মুছে ফেলার বাটন আছে।
            </p>
          ) : null}
          <QbUploadList questions={questions} showActions={canManage} />
        </>
      )}
    </div>
  );
}
