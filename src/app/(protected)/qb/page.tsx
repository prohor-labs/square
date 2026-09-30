import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { Lock, TickCircle } from "@/components/icons";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuestionBankPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const qbs = await getUserQbContainers(userId);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          বোর্ড ও এডমিশন স্ট্যান্ডার্ড অধ্যায়ভিত্তিক ও টপিকভিত্তিক প্রশ্ন অনুশীলন করুন
        </p>
      </div>

      {!qbs || qbs.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-card/50 flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <TickCircle className="size-6" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            কোনো প্রশ্নব্যাংক পাওয়া যায়নি
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            আপনি বর্তমানে যে সকল কোর্সে সক্রিয় রয়েছেন, শুধুমাত্র সেই কোর্সের অন্তর্ভুক্ত প্রশ্নব্যাংকগুলো এখানে দেখতে পাবেন।
          </p>
          <Link
            href="/my-courses"
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            আমার কোর্সসমূহ দেখুন &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
          {qbs.map((qb) => {
            const accessType =
              qb.accessType || (qb.hasAccess ? "enrolled" : "restricted");

            return (
              <Link
                href={`/qb/${qb.slug}`}
                key={qb.id}
                className="block group h-full"
              >
                <div className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-3.5 sm:p-4 md:p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center text-white shadow-lg border bg-primary/20 border-border/50">
                  {/* Background Layer with Hover Depth */}
                  <div className="absolute inset-0 transition-all duration-300 bg-gradient-to-br from-primary via-primary/95 to-primary/85 opacity-95 group-hover:opacity-100 group-hover:scale-105" />

                  {/* Top Corner Badge for Access Status */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20">
                    <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1 shadow-xs">
                      <TickCircle className="size-3" />
                      <span>{accessType === "public" ? "উন্মুক্ত" : "সক্রিয়"}</span>
                    </span>
                  </div>

                  {/* Center Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                    <h3 className="font-black text-[16px] sm:text-[20px] md:text-[24px] lg:text-[26px] leading-tight drop-shadow-md text-white line-clamp-3">
                      {qb.title}
                    </h3>

                    {qb.description && (
                      <p className="text-white/90 text-[11px] sm:text-[13px] md:text-sm font-medium mt-1.5 md:mt-2 line-clamp-2 max-w-xs leading-snug">
                        {qb.description}
                      </p>
                    )}

                    <div className="mt-2 sm:mt-3 flex items-center gap-2 text-[10px] sm:text-xs text-white/80 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                      <span>{qb.itemsCount} টি বিষয়</span>
                      <span>•</span>
                      <span>{qb.questionsCount || 0} টি প্রশ্ন</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
