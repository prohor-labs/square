import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbCard } from "@/components/qb/QbCard";
import { getChapterList, getSubjectBySlug } from "@/lib/actions/qb-subject";

export const dynamic = "force-dynamic";

/** One subject and the chapters inside it, with live question counts. */
export default async function QbSubjectPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}): Promise<ReactElement> {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const chapters = await getChapterList(subject.id);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground flex-wrap">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <Link
            href="/qb/subjects"
            className="hover:text-primary transition-colors"
          >
            বিষয়ভিত্তিক
          </Link>
          <span>/</span>
          <span className="text-foreground">{subject.name}</span>
        </div>

        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            {subject.name}
            {subject.paper && (
              <span className="text-primary"> · {subject.paper}</span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            অধ্যায় অনুযায়ী প্রশ্ন দেখুন
          </p>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/10">
          <p className="font-bold text-base sm:text-lg text-foreground">
            এই বিষয়ে কোনো অধ্যায় নেই
          </p>
          <p className="text-xs sm:text-sm mt-1.5">
            অ্যাডমিন আপলোডের সময় অধ্যায় দিলে সেটি এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        /* Chapters are named in full, so they read better as flat rows than as
           square tiles — and there are enough of them to fill two columns. */
        <div className="grid max-w-4xl gap-2.5 sm:grid-cols-2 sm:gap-3">
          {chapters.map((chapter) => (
            <QbCard
              key={chapter.id}
              href={`/qb/subjects/${subject.slug}/${chapter.slug}`}
              title={chapter.name}
              subtitle="অধ্যায়"
              questions={chapter.questions}
              variant="row"
            />
          ))}
        </div>
      )}
    </div>
  );
}
