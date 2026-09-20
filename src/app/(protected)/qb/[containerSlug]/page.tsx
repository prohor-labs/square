import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbAccessRestrictedCard } from "@/components/qb/QbAccessRestrictedCard";
import { db } from "@/db";
import { items } from "@/db/schema";
import { checkQbContainerAccess } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QbSubjectsPage({
  params,
}: {
  readonly params: Promise<{ containerSlug: string }>;
}): Promise<ReactElement> {
  const { containerSlug } = await params;
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

  const itemList = await db.query.items.findMany({
    where: eq(items.containerId, qb.id),
    with: {
      subitems: {
        with: {
          questions: {
            columns: { id: true },
          },
        },
      },
    },
    orderBy: (items, { asc }) => [asc(items.name)],
  });

  const isSingleItemYearBased =
    itemList.length === 1 && (itemList[0].subitems?.length || 0) > 0;

  const isAdmissionOrYearBased =
    isSingleItemYearBased ||
    qb.title.includes("বিশ্ববিদ্যালয়") ||
    qb.title.includes("ভর্তি") ||
    qb.title.includes("Varsity") ||
    qb.title.includes("Admission") ||
    qb.title.includes("বুয়েট") ||
    qb.title.includes("মেডিকেল") ||
    qb.title.includes("ডেন্টাল") ||
    qb.title.includes("গুচ্ছ");

  // If there is only 1 item containing the years/sessions, show the years directly
  if (isSingleItemYearBased) {
    const singleSubject = itemList[0];
    const yearsList = singleSubject.subitems || [];

    return (
      <div className="flex flex-col w-full max-w-7xl mx-auto pb-8 pt-2 md:py-8">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground mb-2">
            <Link href="/qb" className="hover:text-primary transition-colors">
              প্রশ্নব্যাংক
            </Link>
            <span>/</span>
            <span className="text-foreground">{qb.title}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            সালসমূহ / সেশন
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {qb.title} এর বিগত বছরের প্রশ্ন ও সমাধান দেখতে সাল নির্বাচন করুন
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
          {yearsList.map((ch) => {
            const qCount = ch.questions?.length || 0;

            return (
              <Link
                href={`/qb/${qb.slug}/${singleSubject.slug}/${ch.slug}`}
                key={ch.id}
                className="block group h-full"
              >
                <div className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-3.5 sm:p-4 md:p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center text-white shadow-lg border bg-primary/20 border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85 opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />

                  <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                    <h3 className="font-black text-[16px] sm:text-[20px] md:text-[24px] lg:text-[26px] leading-tight drop-shadow-md text-white line-clamp-3">
                      {ch.name}
                    </h3>

                    <div className="mt-2.5 sm:mt-3.5 flex items-center gap-2 text-[10px] sm:text-xs text-white/90 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                      <span>{qCount} টি প্রশ্ন</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {yearsList.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
              কোনো সাল পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-8 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground mb-2">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <span className="text-foreground">{qb.title}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          {isAdmissionOrYearBased ? "সালসমূহ / বিষয়সমূহ" : "বিষয়সমূহ"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {isAdmissionOrYearBased
            ? `${qb.title} এর অন্তর্গত সাল বা বিষয় নির্বাচন করুন`
            : `${qb.title} এর অন্তর্গত বিষয় নির্বাচন করুন`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
        {itemList?.map((sub) => {
          const chaptersCount = sub.subitems?.length || 0;
          const questionsCount = (sub.subitems || []).reduce(
            (acc, s) => acc + (s.questions?.length || 0),
            0,
          );

          return (
            <Link
              href={`/qb/${qb.slug}/${sub.slug}`}
              key={sub.id}
              className="block group h-full"
            >
              <div className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-3.5 sm:p-4 md:p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center text-white shadow-lg border bg-primary/20 border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85 opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />

                <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                  <h3 className="font-black text-[16px] sm:text-[20px] md:text-[24px] lg:text-[26px] leading-tight drop-shadow-md text-white line-clamp-3">
                    {sub.name}
                  </h3>

                  <div className="mt-2.5 sm:mt-3.5 flex items-center gap-2 text-[10px] sm:text-xs text-white/90 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                    {isAdmissionOrYearBased ? (
                      <span>{questionsCount} টি প্রশ্ন</span>
                    ) : (
                      <>
                        <span>{chaptersCount} টি অধ্যায়</span>
                        <span>•</span>
                        <span>{questionsCount} টি প্রশ্ন</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {itemList?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-2xl">
            কোনো বিষয় বা সাল পাওয়া যায়নি।
          </div>
        )}
      </div>
    </div>
  );
}
