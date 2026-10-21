import { headers } from "next/headers";
import type { ReactElement } from "react";
import { QbFilterBar } from "@/components/qb/qb-filter-bar";
import { QbUploadList } from "@/components/qb/qb-upload-list";
import { QbUploader } from "@/components/qb/qb-uploader";
import { getQbUploads } from "@/lib/actions/qb-uploads";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** A query param can arrive twice (`?subject=a&subject=b`); take the first. */
function readParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The question bank screen.
 *
 * One job only: take a CSV of questions and show the questions that have been
 * uploaded. Admins upload; everyone else still sees the notice, because the
 * bank is not open to students yet.
 */
export default async function QbPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex w-full max-w-3xl flex-col gap-5 pb-12 pt-2 md:py-8">
        <nav
          aria-label="ব্রেডক্রাম"
          className="text-xs text-muted-foreground sm:text-sm"
        >
          প্রশ্নব্যাংক
        </nav>

        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            প্রশ্নব্যাংক
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            প্রশ্নব্যাংকটি এখন নতুন করে সাজানো হচ্ছে। খুব শীঘ্রই এখানে নতুন প্রশ্ন যোগ করা হবে।
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
            আপনার পরীক্ষা ও পরীক্ষার প্রশ্ন যেমন ছিল তেমনই আছে — সেগুলোতে কোনো পরিবর্তন
            হয়নি।
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const { total, allTotal, questions, filterTree, selected } =
    await getQbUploads({
      subjectId: readParam(params.subject),
      chapterId: readParam(params.chapter),
      topicId: readParam(params.topic),
    });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-16 pt-2 md:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          CSV আপলোড করুন — নিচে আপলোড করা প্রশ্নগুলো দেখা যাবে।
        </p>
      </header>

      <QbUploader />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold sm:text-base">আপলোড করা প্রশ্ন</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold">
            {total === allTotal
              ? `মোট ${total} টি`
              : `${total} / ${allTotal} টি`}
          </span>
        </div>

        <QbFilterBar tree={filterTree} selected={selected} />

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            {allTotal > 0 ? (
              <>
                <p className="text-sm font-bold">এই ফিল্টারে কোনো প্রশ্ন নেই</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  বিষয়, অধ্যায় বা টপিক বদলে আবার দেখুন।
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">এখনো কোনো প্রশ্ন আপলোড হয়নি</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  উপরের বক্স থেকে একটি CSV ফাইল আপলোড করুন।
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <QbUploadList questions={questions} />
            {total > questions.length && (
              <p className="pt-1 text-center text-[11px] text-muted-foreground">
                মোট {total} টির মধ্যে সর্বশেষ {questions.length} টি দেখানো হচ্ছে।
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
