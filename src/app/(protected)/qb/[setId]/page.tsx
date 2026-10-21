import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ArrowLeft2, FileText } from "@/components/icons";
import { QbUploadList } from "@/components/qb/qb-upload-list";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbFileWithQuestions } from "@/lib/qb-bank";

export const dynamic = "force-dynamic";

/** One uploaded file, shown read-only to students and admins alike. */
export default async function QbFilePage({
  params,
}: {
  readonly params: Promise<{ setId: string }>;
}): Promise<ReactElement> {
  const { setId } = await params;
  const data = await getQbFileWithQuestions(setId);

  if (!data) notFound();

  const { file, questions } = data;

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
        <QbUploadList questions={questions} showActions={false} />
      )}
    </div>
  );
}
