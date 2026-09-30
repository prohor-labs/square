import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight2,
  BookOpen,
  CalendarTick,
  Send,
  TaskSquare,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getMyCourses } from "@/lib/actions/course";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const res = userId ? await getMyCourses(userId) : [];
  const batches = Array.isArray(res) ? res : [];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 sm:pb-16 pt-0 sm:pt-2 md:pt-4 gap-6 sm:gap-8 px-3 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 border-b pb-5">
        <Link href="/#batches-section">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-xl text-xs sm:text-sm font-semibold h-10 gap-2 border-border/70"
          >
            <BookOpen className="size-4 text-primary" />
            নতুন কোর্স ব্রাউজ করুন
          </Button>
        </Link>
      </div>

      {/* Courses Grid */}
      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {batches.map((batch: any) => {
            const modulesList = Array.isArray(batch.modules)
              ? batch.modules
              : Array.isArray(batch.curriculum)
                ? batch.curriculum
                : [];
            const modulesCount = modulesList.length;
            const totalClasses = modulesList.reduce(
              (acc: number, m: any) => acc + (m.totalClasses || 0),
              0,
            );

            return (
              <div
                key={batch.enrollmentId || batch.id}
                className="group border border-border/70 rounded-2xl p-4 sm:p-6 bg-card flex flex-col justify-between gap-5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Image & Badge Header */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border/50">
                    <Image
                      src={batch.image || "/images/image.png"}
                      alt={batch.name}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-black/75 text-white backdrop-blur-md shadow-xs">
                        {batch.hscBatch}
                      </span>
                      {batch.badge && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary text-primary-foreground shadow-xs">
                          {batch.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h2 className="font-bold text-lg sm:text-xl leading-snug group-hover:text-primary transition-colors">
                      {batch.name}
                    </h2>
                    {batch.subtitle && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {batch.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Course Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    {modulesCount > 0 && (
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md font-medium border border-border/40">
                        <TaskSquare className="size-3.5 text-primary shrink-0" />
                        {modulesCount} টি মডিউল
                      </span>
                    )}
                    {totalClasses > 0 && (
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md font-medium border border-border/40">
                        <BookOpen className="size-3.5 text-primary shrink-0" />
                        {totalClasses}+ টি ক্লাস
                      </span>
                    )}
                    {batch.batches && batch.batches.length > 0 && (
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md font-medium border border-border/40">
                        <CalendarTick className="size-3.5 text-primary shrink-0" />
                        পরীক্ষা ব্যাচ যুক্ত
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-border/40">
                  {batch.details?.telegramGroupUrl && (
                    <a
                      href={batch.details.telegramGroupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex-1"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full rounded-xl text-xs font-semibold h-10 gap-1.5"
                      >
                        <Send className="size-3.5 text-blue-500" />
                        টেলিগ্রাম গ্রুপ
                      </Button>
                    </a>
                  )}

                  <Link
                    href={`/my-courses/${batch.id}`}
                    className="w-full sm:w-auto flex-1"
                  >
                    <Button
                      size="sm"
                      className="w-full rounded-xl text-xs sm:text-sm font-semibold h-10 gap-1.5 shadow-xs"
                    >
                      ক্লাসরুমে যান
                      <ArrowRight2 className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl text-muted-foreground bg-muted/10 px-4 sm:px-6">
          <div className="size-14 sm:size-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
            <BookOpen className="size-7 sm:size-8" />
          </div>
          <h2 className="font-bold text-lg sm:text-xl text-foreground">
            আপনার কোনো এনরোল করা কোর্স নেই
          </h2>
          <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
            আপনি এখনও কোনো কোর্সে এনরোল করেননি। আমাদের চলমান কোর্সগুলো দেখতে পারেন এবং
            আপনার পছন্দের ব্যাচে যুক্ত হতে পারেন।
          </p>
          <Link href="/#batches-section" className="mt-6">
            <Button className="rounded-xl px-6 h-11 text-sm font-semibold shadow-xs">
              চলমান কোর্সসমূহ দেখুন
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
