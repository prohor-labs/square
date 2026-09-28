"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight2,
  Calendar,
  Clock,
  DocumentDownload,
  Flame,
  Information,
  Star,
  Teacher,
  TickCircle,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getCourses } from "@/lib/actions/course";

type CourseItem = {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly title?: string;
  readonly subtitle?: string | null;
  readonly description?: string | null;
  readonly hscBatch?: string;
  readonly price: number;
  readonly originalPrice?: number | null;
  readonly image: string;
  readonly badge?: string | null;
  readonly duration?: string;
  readonly rating?: string;
  readonly ratingCount?: string;
  readonly routinePdfUrl?: string;
  readonly telegramGroupUrl?: string;
  readonly features?: string[];
  readonly instructors?: Array<{
    readonly name: string;
    readonly role?: string;
    readonly institution?: string;
  }>;
};

export function CoursesPricingSection() {
  const [selectedBatch, setSelectedBatch] = useState<
    "HSC 26" | "HSC 27" | "Admission"
  >("HSC 26");
  const [coursesList, setCoursesList] = useState<readonly CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setIsLoading(true);
      const data = await getCourses(selectedBatch);
      setCoursesList(data as any);
      setIsLoading(false);
    }
    loadCourses();
  }, [selectedBatch]);

  return (
    <section
      id="courses-section"
      className="bg-muted/20 py-16 md:py-24 px-4 sm:px-6 lg:px-8 mt-12 border-t border-border/50 scroll-mt-20 w-full relative overflow-hidden"
    >
      {/* Background soft glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            আমাদের এক্সক্লুসিভ কোর্সসমূহ
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
            দেশের শীর্ষ মেন্টরদের তত্ত্বাবধানে সাজানো সেরা এক্সাম ও একাডেমিক কোর্স
          </p>

          {/* Batch Selector Tabs */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/80 dark:bg-muted/40 border border-border/60 backdrop-blur-md shadow-xs">
              {(["HSC 26", "HSC 27", "Admission"] as const).map((batch) => {
                const isSelected = selectedBatch === batch;
                return (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => setSelectedBatch(batch)}
                    className={`px-5 sm:px-7 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-background text-foreground shadow-sm border border-border/40"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    {batch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Courses Listing Content */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="size-8 text-primary" />
            <span className="text-sm font-medium">কোর্সসমূহ লোড হচ্ছে...</span>
          </div>
        ) : coursesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {coursesList.map((course) => {
              const displayTitle = course.name || course.title || "কোর্স";
              const discountPercent =
                course.originalPrice && course.originalPrice > course.price
                  ? Math.round(
                      ((course.originalPrice - course.price) /
                        course.originalPrice) *
                        100
                    )
                  : null;
              const hasDiscount = Boolean(discountPercent && discountPercent > 0);
              const topFeatures = (course.features || []).slice(0, 3);
              const leadInstructor = course.instructors?.[0];

              return (
                <Card
                  key={course.slug}
                  className="group relative bg-card/95 hover:bg-card border border-border/70 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-0"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <Image
                      alt={displayTitle}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      src={course.image || "/images/image.png"}
                      width={600}
                      height={338}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                        {course.badge || "স্পেশাল ব্যাচ"}
                      </span>

                      {hasDiscount && (
                        <span className="text-[11px] font-extrabold bg-rose-500 text-white px-2.5 py-1 rounded-full shadow-md">
                          {discountPercent}% ছাড়
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata inside Image */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-semibold pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                        <Clock className="size-3.5 text-primary" />
                        <span className="text-[11px]">
                          {course.duration || "১ বছর এক্সেস"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-amber-400">
                        <Star className="size-3.5 fill-current" />
                        <span className="text-[11px] font-bold">
                          {course.rating || "5.0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-3.5">
                      {/* Course Title */}
                      <Link href={`/courses/${course.slug}`}>
                        <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {displayTitle}
                        </h3>
                      </Link>

                      {/* Instructor Tag */}
                      {leadInstructor && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Teacher className="size-3.5" />
                          </div>
                          <span className="font-semibold text-foreground/80 truncate">
                            {leadInstructor.name}
                            {leadInstructor.institution && (
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                • {leadInstructor.institution}
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Feature Highlights Pills */}
                      {topFeatures.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {topFeatures.map((feat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <TickCircle className="size-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price & Action Section */}
                    <div className="space-y-3 pt-3 border-t border-border/50">
                      {/* Price Strip */}
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-foreground">
                            {course.price === 0 ? "ফ্রী" : `৳${course.price}`}
                          </span>
                          {course.originalPrice &&
                            course.originalPrice > course.price && (
                              <span className="text-sm font-semibold text-muted-foreground line-through decoration-muted-foreground/60">
                                ৳{course.originalPrice}
                              </span>
                            )}
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-0.5 rounded-md">
                          এককালীন ফি
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          render={<Link href={`/courses/${course.slug}`} />}
                          className="w-full bg-primary text-primary-foreground py-2.5 h-auto rounded-xl font-bold text-sm hover:bg-primary/90 transition-all text-center shadow-xs hover:shadow-md cursor-pointer group/btn flex items-center justify-center gap-1.5"
                        >
                          <span>এনরোল করুন</span>
                          <ArrowRight2 className="size-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Button>

                        {/* Secondary Actions (Routine & Details) */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          {course.routinePdfUrl ? (
                            <Link
                              href={course.routinePdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/routine inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
                            >
                              <span className="size-5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover/routine:scale-110 group-hover/routine:bg-indigo-500 group-hover/routine:text-white transition-all duration-200 shrink-0">
                                <Calendar className="size-3" />
                              </span>
                              <span>রুটিন</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/courses/${course.slug}`}
                              className="group/routine inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
                            >
                              <span className="size-5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover/routine:scale-110 group-hover/routine:bg-indigo-500 group-hover/routine:text-white transition-all duration-200 shrink-0">
                                <Calendar className="size-3" />
                              </span>
                              <span>রুটিন</span>
                            </Link>
                          )}

                          <Link
                            href={`/courses/${course.slug}`}
                            className="group/details inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
                          >
                            <span className="size-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover/details:scale-110 group-hover/details:bg-blue-500 group-hover/details:text-white transition-all duration-200 shrink-0">
                              <Information className="size-3" />
                            </span>
                            <span>বিস্তারিত</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : selectedBatch === "HSC 27" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto">
            <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="size-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              HSC 27 ব্যাচের কোর্স খুব শীঘ্রই উন্মুক্ত করা হবে
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              আমাদের টেলিগ্রাম সাপোর্ট গ্রুপে যুক্ত হয়ে সবার আগে ব্যাচ সংক্রান্ত
              আপডেট ও স্পেশাল ছাড় পেয়ে যান।
            </p>
            <Button
              render={
                <a
                  href="https://t.me/shu_yaib"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              className="mt-2 rounded-xl font-bold text-xs"
            >
              <span>টেলিগ্রাম গ্রুপে যুক্ত হোন &rarr;</span>
            </Button>
          </Card>
        ) : selectedBatch === "Admission" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="size-6 fill-amber-500" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              ইঞ্জিনিয়ারিং ও ভার্সিটি এডমিশন কোর্স
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              এইচএসসি বোর্ড পরীক্ষার পরই শুরু হবে পূর্ণাঙ্গ ডেডিকেটেড এডমিশন
              মাস্টারক্লাস।
            </p>
            <Button
              render={
                <a
                  href="https://t.me/shu_yaib"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              className="mt-2 rounded-xl font-bold text-xs"
            >
              <span>নোটিফিকেশনের জন্য যুক্ত থাকুন &rarr;</span>
            </Button>
          </Card>
        ) : (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto">
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              কোনো কোর্স পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              এই ক্যাটাগরিতে বর্তমানে কোনো কোর্স যুক্ত করা হয়নি।
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}

