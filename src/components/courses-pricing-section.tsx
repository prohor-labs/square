"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Flame, Information, Star } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getCourses } from "@/lib/actions/course";

type CourseItem = {
  readonly id: string;
  readonly slug: string;
  readonly name?: string;
  readonly title?: string;
  readonly price: number;
  readonly image: string;
  readonly badge?: string | null;
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
              <button
                type="button"
                onClick={() => setSelectedBatch("HSC 26")}
                className={`px-4 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBatch === "HSC 26"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                HSC 26
              </button>
              <button
                type="button"
                onClick={() => setSelectedBatch("HSC 27")}
                className={`px-4 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBatch === "HSC 27"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                HSC 27
              </button>
              <button
                type="button"
                onClick={() => setSelectedBatch("Admission")}
                className={`px-4 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedBatch === "Admission"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                Admission
              </button>
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

                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-foreground mb-3 line-clamp-2 leading-snug">
                      {course.name || course.title}
                    </h3>
                    <div className="bg-muted/40 border-l-4 border-foreground p-3.5 rounded-r-2xl mb-6 flex items-baseline justify-between shadow-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground">
                          ৳{course.price}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        এককালীন ফি
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      className="w-full bg-primary text-primary-foreground py-3.5 h-auto rounded-xl font-bold text-md hover:bg-primary/90 transition-all text-center shadow-md cursor-pointer"
                    >
                      <Link href={`/courses/${course.slug}`}>
                        এনরোলমেন্ট দেখুন
                      </Link>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="flex items-center justify-center gap-2 py-2.5 h-auto border-border/80 rounded-xl text-muted-foreground font-bold hover:border-foreground hover:text-foreground transition-all"
                      >
                        <Link href={`/courses/${course.slug}`}>
                          <Calendar
                            data-icon="inline-start"
                            className="size-4 text-indigo-500"
                          />
                          <span className="text-xs">রুটিন</span>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="flex items-center justify-center gap-1.5 py-2.5 h-auto border-border/80 rounded-xl text-foreground font-bold hover:bg-muted transition-all"
                      >
                        <Link href={`/courses/${course.slug}`}>
                          <Information
                            data-icon="inline-start"
                            className="size-3.5 text-blue-500"
                          />
                          <span className="text-xs font-bold">বিস্তারিত</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : selectedBatch === "HSC 27" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs">
            <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="size-6" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              HSC 27 ব্যাচের কোর্স খুব শীঘ্রই উন্মুক্ত করা হবে
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              আমাদের টেলিগ্রাম সাপোর্ট গ্রুপে যুক্ত হয়ে সবার আগে ব্যাচ সংক্রান্ত আপডেট ও স্পেশাল
              ছাড় পেয়ে যান।
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-2 rounded-xl font-bold text-xs"
            >
              <a
                href="https://t.me/shu_yaib"
                target="_blank"
                rel="noopener noreferrer"
              >
                টেলিগ্রাম গ্রুপে যুক্ত হোন &rarr;
              </a>
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
              asChild
              variant="outline"
              className="mt-2 rounded-xl font-bold text-xs"
            >
              <a
                href="https://t.me/shu_yaib"
                target="_blank"
                rel="noopener noreferrer"
              >
                নোটিফিকেশনের জন্য যুক্ত থাকুন &rarr;
              </a>
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
