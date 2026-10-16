"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Star, TickCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getCourses } from "@/lib/actions/course";
import { HSC_BATCH_TAGS, type HscBatchTag } from "@/lib/utils";

type CourseItem = {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly title?: string;
  readonly price: number;
  readonly image: string;
  readonly badge?: string | null;
  readonly originalPrice?: number | null;
  readonly features: readonly string[];
};

export function CoursesPricingSection() {
  const [selectedBatch, setSelectedBatch] = useState<HscBatchTag>("Academic");
  const [coursesList, setCoursesList] = useState<readonly CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setIsLoading(true);
      const data = await getCourses(selectedBatch);
      setCoursesList(data);
      setIsLoading(false);
    }
    loadCourses();
  }, [selectedBatch]);

  return (
    <section
      id="courses-section"
      className="bg-muted/30 pt-12 pb-20 px-4 mt-16 border-t border-border/60 scroll-mt-20 w-full"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            আমাদের এক্সক্লুসিভ কোর্সসমূহ
          </h2>
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-muted/60 dark:bg-muted/30 border border-border/50 overflow-x-auto no-scrollbar max-w-full">
              {HSC_BATCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedBatch(tag)}
                  className={`px-4 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedBatch === tag
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {tag === "Academic" ? "একাডেমিক" : "এডমিশন"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="size-8 text-primary" />
            <span className="text-sm font-medium">কোর্সসমূহ লোড হচ্ছে...</span>
          </div>
        ) : coursesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coursesList.map((course) => (
              <Card
                key={course.slug}
                className="bg-card rounded-[2rem] overflow-hidden shadow-md border-border/60 hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between p-0"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    alt={course.name || course.title || "Course"}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={course.image || "/images/image.png"}
                    width={600}
                    height={338}
                    unoptimized
                  />
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5 md:gap-5 md:p-6">
                  <h3 className="line-clamp-2 text-base leading-snug font-extrabold text-foreground md:text-lg">
                    {course.name || course.title}
                  </h3>

                  {/* What the course covers — two across so the box stays short
                      whichever way the cards are sized. */}
                  {course.features.length > 0 && (
                    <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {course.features.slice(0, 6).map((feature: string) => (
                        <li
                          key={feature}
                          className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground"
                        >
                          <TickCircle className="mt-px size-3.5 shrink-0 text-emerald-500" />
                          <span className="line-clamp-2">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto flex flex-col gap-3 border-t border-border/50 pt-4">
                    <div className="flex flex-col">
                      {course.originalPrice ? (
                        <span className="text-xs font-semibold text-muted-foreground line-through">
                          ৳{course.originalPrice}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          এককালীন ফি
                        </span>
                      )}
                      <span className="text-2xl font-black text-emerald-600 tabular-nums md:text-3xl dark:text-emerald-500">
                        ৳{course.price}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        render={<Link href={`/courses/${course.slug}`} />}
                        variant="outline"
                        className="h-11 rounded-full font-bold transition-all"
                      >
                        বিস্তারিত
                      </Button>

                      <Button
                        render={<Link href={`/courses/${course.slug}`} />}
                        className="h-11 rounded-full border-0 bg-emerald-500 font-bold text-white shadow-xs transition-all hover:bg-emerald-600"
                      >
                        ভর্তি হোন
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : selectedBatch === "Academic" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs">
            <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="size-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              একাডেমিক কোর্স খুব শীঘ্রই উন্মুক্ত করা হবে
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              আমাদের টেলিগ্রাম সাপোর্ট গ্রুপে যুক্ত হয়ে সবার আগে ব্যাচ সংক্রান্ত আপডেট ও স্পেশাল
              ছাড় পেয়ে যান।
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
              টেলিগ্রাম গ্রুপে যুক্ত হোন &rarr;
            </Button>
          </Card>
        ) : selectedBatch === "Admission" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="size-6 fill-amber-500" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              ইঞ্জিনিয়ারিং ও ভার্সিটি এডমিশন কোর্স
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              এইচএসসি বোর্ড পরীক্ষার পরই শুরু হবে পূর্ণাঙ্গ ডেডিকেটেড এডমিশন মাস্টারক্লাস।
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
              নোটিফিকেশনের জন্য যুক্ত থাকুন &rarr;
            </Button>
          </Card>
        ) : (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs">
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
