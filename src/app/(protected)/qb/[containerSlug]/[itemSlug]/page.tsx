import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbAccessRestrictedCard } from "@/components/qb/QbAccessRestrictedCard";
import { db } from "@/db";
import { items, subitems } from "@/db/schema";
import { checkQbContainerAccess } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QbChaptersPage({
  params,
}: {
  readonly params: Promise<{ containerSlug: string; itemSlug: string }>;
}): Promise<ReactElement> {
  const { containerSlug, itemSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const accessInfo = await checkQbContainerAccess(containerSlug, userId);
  if (!accessInfo.exists || !accessInfo.container) {
    notFound();
  }

  const qb = accessInfo.container;

  // Access check: non-enrolled users cannot see restricted question banks
  if (!accessInfo.hasAccess) {
    notFound();
  }

  const subject = await db.query.items.findFirst({
    where: eq(items.slug, itemSlug),
  });

  if (!subject) notFound();

  const chapterList = await db.query.subitems.findMany({
    where: eq(subitems.itemId, subject.id),
    with: {
      questions: {
        columns: { id: true },
      },
      topics: {
        columns: { id: true },
      },
    },
    orderBy: (subitems, { asc }) => [asc(subitems.orderNo)],
  });

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-8 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground mb-2 flex-wrap">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <Link
            href={`/qb/${qb.slug}`}
            className="hover:text-primary transition-colors"
          >
            {qb.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">{subject.name}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          {subject.name.includes("বোর্ড") ||
          subject.name.includes("বিশ্ববিদ্যালয়") ||
          qb.title.includes("বিশ্ববিদ্যালয়") ||
          qb.title.includes("ভর্তি") ||
          qb.title.includes("Varsity") ||
          qb.title.includes("Admission")
            ? "সালসমূহ / সেশন"
            : "অধ্যায়সমূহ"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {subject.name} এর প্রশ্ন সমাধান করতে সাল বা অধ্যায় নির্বাচন করুন
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {chapterList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
            {chapterList.map((ch) => {
              const qCount = ch.questions?.length || 0;
              const topicsCount = ch.topics?.length || 0;

              return (
                <Link
                  href={`/qb/${qb.slug}/${subject.slug}/${ch.slug}`}
                  key={ch.id}
                  className="block group h-full"
                >
                  <div className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-3.5 sm:p-4 md:p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center text-white shadow-lg border bg-primary/20 border-border/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85 opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />

                    <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                      <h3 className="font-black text-[15px] sm:text-[18px] md:text-[22px] lg:text-[24px] leading-tight drop-shadow-md text-white line-clamp-3">
                        {ch.name}
                      </h3>

                      <div className="mt-2.5 sm:mt-3.5 flex items-center gap-2 text-[10px] sm:text-xs text-white/90 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 flex-wrap justify-center">
                        <span>{qCount} টি প্রশ্ন</span>
                        {topicsCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{topicsCount} টি বিষয়/টপিক</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
            কোনো সাল বা অধ্যায় পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}
