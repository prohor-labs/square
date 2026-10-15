import Link from "next/link";
import type { ReactElement } from "react";
import { QbCard } from "@/components/qb/QbCard";
import { getSubjectList } from "@/lib/actions/qb-subject";

export const dynamic = "force-dynamic";

/**
 * Subject-wise entry point.
 *
 * Only subjects that already have questions are listed, so the page needs no
 * maintenance as the bank grows.
 */
export default async function QbSubjectsPage(): Promise<ReactElement> {
  const subjects = await getSubjectList();

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground flex-wrap">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <span className="text-foreground">বিষয়ভিত্তিক</span>
        </div>

        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            বিষয়ভিত্তিক প্রশ্নব্যাংক
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            {subjects.length === 0
              ? "এখনো কোনো বিষয়ভিত্তিক প্রশ্ন যোগ হয়নি"
              : "বিষয় ও অধ্যায় অনুযায়ী প্রশ্ন দেখুন"}
          </p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/10">
          <p className="font-bold text-base sm:text-lg text-foreground">
            এখনো কোনো বিষয়ভিত্তিক প্রশ্ন যোগ হয়নি
          </p>
          <p className="text-xs sm:text-sm mt-1.5">
            অ্যাডমিন আপলোডের সময় বিষয় ও অধ্যায় দিলে সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        /* Three per row, capped so the square cards stay card-sized on a wide
           screen instead of stretching. */
        <div className="grid max-w-3xl grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3">
          {subjects.map((subject) => (
            <QbCard
              key={subject.id}
              href={`/qb/subjects/${subject.slug}`}
              title={subject.name}
              subtitle={subject.paper || "সব পত্র"}
              questions={subject.questions}
              variant="wide"
            />
          ))}
        </div>
      )}
    </div>
  );
}
