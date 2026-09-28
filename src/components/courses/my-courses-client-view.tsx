"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/shared/course-card";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";

interface MyCoursesClientViewProps {
  readonly enrolledCourses: any[];
  readonly allCourses: any[];
  readonly defaultTab?: string;
}

export function MyCoursesClientView({
  enrolledCourses,
  allCourses,
  defaultTab = "my",
}: MyCoursesClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTab === "all" ? "all" : "my"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const enrolledIdSet = new Set(enrolledCourses.map((c) => c.id));

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const tabs = [
    { id: "my", label: "আমার কোর্স", count: enrolledCourses.length },
    { id: "all", label: "সকল কোর্স", count: allCourses.length },
  ];

  // Search filtering
  const filterCourse = (c: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (c.name || c.title || "").toLowerCase();
    const sub = (c.subtitle || "").toLowerCase();
    const batch = (c.hscBatch || "").toLowerCase();
    return name.includes(query) || sub.includes(query) || batch.includes(query);
  };

  const filteredEnrolled = enrolledCourses.filter(filterCourse);
  const filteredAll = allCourses.filter(filterCourse);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── Reusable Custom Sticky Filter Bar ─────────────────────────────── */}
      <CustomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="কোর্স খুঁজুন..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toBanglaDigits={toBanglaDigits}
      />

      {/* ─── Enrolled Courses View ────────────────────────────────────────── */}
      {activeTab === "my" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                আমার এনরোল্ড কোর্সসমূহ
              </h2>
              <p className="text-xs text-muted-foreground">
                আপনার সক্রিয় কোর্স ও নিয়মিত ক্লাস রুটিন
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              মোট {toBanglaDigits(filteredEnrolled.length)} টি কোর্স
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredEnrolled.map((course) => (
              <CourseCard
                key={course.enrollmentId || course.id}
                course={course}
                isEnrolled
                enrollmentHref={`/my-courses/${course.id}`}
              />
            ))}

            {filteredEnrolled.length === 0 && (
              <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
                <div className="size-14 sm:size-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
                  <BookOpen className="size-7 sm:size-8" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  {searchQuery
                    ? "আপনার অনুসন্ধান অনুযায়ী কোনো কোর্স পাওয়া যায়নি"
                    : "আপনার কোনো এনরোল করা কোর্স নেই"}
                </h3>
                <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                  {searchQuery
                    ? "অনুগ্রহ করে অন্য নাম বা কিওয়ার্ড দিয়ে খুঁজুন।"
                    : "আমাদের চলমান কোর্সগুলো দেখতে পারেন এবং আপনার পছন্দের ব্যাচে যুক্ত হতে পারেন।"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setActiveTab("all")}
                    className="mt-6 rounded-xl px-6 h-10 text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    চলমান কোর্সসমূহ দেখুন
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── All Courses View ─────────────────────────────────────────────── */}
      {activeTab === "all" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                সকল চলমান কোর্স
              </h2>
              <p className="text-xs text-muted-foreground">
                নতুন ব্যাচে যুক্ত হতে কোর্স বেছে নিন
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              মোট {toBanglaDigits(filteredAll.length)} টি কোর্স
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredAll.map((course) => {
              const isEnrolled = enrolledIdSet.has(course.id);
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={isEnrolled}
                  enrollmentHref={isEnrolled ? `/my-courses/${course.id}` : undefined}
                />
              );
            })}

            {filteredAll.length === 0 && (
              <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
                <div className="size-14 sm:size-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
                  <BookOpen className="size-7 sm:size-8" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  কোনো কোর্স পাওয়া যায়নি
                </h3>
                <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                  অনুগ্রহ করে অন্য কোনো কিওয়ার্ড দিয়ে সার্চ করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
