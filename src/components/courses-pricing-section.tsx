"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flame, Star } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CourseCard } from "@/components/shared/course-card";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";
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
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [coursesList, setCoursesList] = useState<readonly CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setIsLoading(true);
      const data = await getCourses();
      setCoursesList(data as any);
      setIsLoading(false);
    }
    loadCourses();
  }, []);

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const countHsc26 = coursesList.filter((c) => (c.hscBatch || "").includes("26")).length;
  const countHsc27 = coursesList.filter((c) => (c.hscBatch || "").includes("27")).length;
  const countAdmission = coursesList.filter((c) => {
    const b = (c.hscBatch || "").toLowerCase();
    const t = (c.name || c.title || "").toLowerCase();
    return b.includes("admission") || t.includes("admission") || t.includes("এডমিশন");
  }).length;

  const tabs = [
    { id: "all", label: "সকল কোর্স", count: coursesList.length },
    { id: "HSC 26", label: "HSC 26", count: countHsc26 },
    { id: "HSC 27", label: "HSC 27", count: countHsc27 },
    { id: "Admission", label: "এডমিশন", count: countAdmission },
  ];

  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      // Tab matching
      if (activeTab === "HSC 26") {
        if (!(course.hscBatch || "").includes("26")) return false;
      } else if (activeTab === "HSC 27") {
        if (!(course.hscBatch || "").includes("27")) return false;
      } else if (activeTab === "Admission") {
        const b = (course.hscBatch || "").toLowerCase();
        const t = (course.name || course.title || "").toLowerCase();
        if (!b.includes("admission") && !t.includes("admission") && !t.includes("এডমিশন")) {
          return false;
        }
      }

      // Search matching
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const title = (course.name || course.title || "").toLowerCase();
      const subtitle = (course.subtitle || "").toLowerCase();
      const desc = (course.description || "").toLowerCase();
      const batch = (course.hscBatch || "").toLowerCase();
      return title.includes(query) || subtitle.includes(query) || desc.includes(query) || batch.includes(query);
    });
  }, [coursesList, activeTab, searchQuery]);

  return (
    <section
      id="courses-section"
      className="bg-muted/20 py-16 md:py-24 px-4 sm:px-6 lg:px-8 mt-12 border-t border-border/50 scroll-mt-20 w-full relative overflow-hidden"
    >
      {/* Background soft glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            আমাদের এক্সক্লুসিভ কোর্সসমূহ
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            দেশের শীর্ষ মেন্টরদের তত্ত্বাবধানে সাজানো সেরা এক্সাম ও একাডেমিক কোর্স
          </p>
        </div>

        {/* Custom Tab Bar Filter */}
        <CustomTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchPlaceholder="কোর্স খুঁজুন..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          toBanglaDigits={toBanglaDigits}
        />

        {/* Courses Listing Content */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="size-8 text-primary" />
            <span className="text-sm font-medium">কোর্সসমূহ লোড হচ্ছে...</span>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch animate-in fade-in duration-200">
            {filteredCourses.map((course) => (
              <CourseCard key={course.slug || course.id} course={course} />
            ))}
          </div>
        ) : activeTab === "HSC 27" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto animate-in fade-in duration-200">
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
        ) : activeTab === "Admission" ? (
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto animate-in fade-in duration-200">
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
          <Card className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-3xl border-border/60 p-8 shadow-xs max-w-xl mx-auto animate-in fade-in duration-200">
            <h3 className="font-bold text-lg sm:text-xl text-foreground">
              {searchQuery
                ? "আপনার অনুসন্ধান অনুযায়ী কোনো কোর্স পাওয়া যায়নি"
                : "কোনো কোর্স পাওয়া যায়নি"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              {searchQuery
                ? "অনুগ্রহ করে অন্য কোনো নাম বা কিওয়ার্ড দিয়ে খুঁজুন।"
                : "এই ক্যাটাগরিতে বর্তমানে কোনো কোর্স যুক্ত করা হয়নি।"}
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}


