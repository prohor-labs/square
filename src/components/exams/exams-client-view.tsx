"use client";

import { useState } from "react";
import { TaskSquare } from "@/components/icons";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";
import { ExamCard } from "@/components/shared/exam-card";

interface ExamsClientViewProps {
  readonly batchExams: any[];
  readonly practiceExams: any[];
  readonly defaultTab?: string;
}

export function ExamsClientView({
  batchExams,
  practiceExams,
  defaultTab = "batch",
}: ExamsClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTab === "practice" || defaultTab === "free" ? "practice" : "batch"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const tabs = [
    { id: "batch", label: "আমার ব্যাচ", count: batchExams.length },
    { id: "practice", label: "প্র্যাকটিস টেস্ট", count: practiceExams.length },
  ];

  // Search filtering
  const filteredBatchExams = batchExams.filter((be) => {
    const title = (be.exam?.title || "").toLowerCase();
    const desc = (be.exam?.description || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return !query || title.includes(query) || desc.includes(query);
  });

  const filteredPracticeExams = practiceExams.filter((exam) => {
    const title = (exam.title || "").toLowerCase();
    const desc = (exam.description || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return !query || title.includes(query) || desc.includes(query);
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── Reusable Custom Sticky Filter Bar ─────────────────────────────── */}
      <CustomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="পরীক্ষা খুঁজুন..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toBanglaDigits={toBanglaDigits}
      />

      {/* ─── Batch Exams View ─────────────────────────────────────────────── */}
      {activeTab === "batch" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                আমার ব্যাচের পরীক্ষা
              </h2>
              <p className="text-xs text-muted-foreground">
                এনরোল্ড ব্যাচের নিয়মিত ও মডেল টেস্ট পরীক্ষাসমূহ
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              মোট {toBanglaDigits(filteredBatchExams.length)} টি পরীক্ষা
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredBatchExams.map((be) => {
              const exam = be.exam;
              if (!exam) return null;
              return (
                <ExamCard
                  key={be.id}
                  exam={exam}
                  startsAt={be.startsAt}
                  endsAt={be.endsAt}
                  isBatchExam
                />
              );
            })}
            {filteredBatchExams.length === 0 && (
              <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
                <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-3">
                  <TaskSquare className="size-7 text-muted-foreground" />
                </div>
                <p className="font-bold text-base sm:text-lg text-foreground">
                  {searchQuery
                    ? "আপনার খোঁজা অনুযায়ী কোনো পরীক্ষা পাওয়া যায়নি"
                    : "আপনার জন্য বর্তমানে কোনো ব্যাচের পরীক্ষা নেই"}
                </p>
                <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                  {searchQuery
                    ? "অনুগ্রহ করে অন্য নাম বা কিওয়ার্ড দিয়ে খুঁজুন।"
                    : "কোনো নতুন পরীক্ষা আপনার ব্যাচে নির্ধারিত হলে এখানে স্বয়ংক্রিয়ভাবে দেখতে পাবেন।"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Practice Tests View ──────────────────────────────────────────── */}
      {activeTab === "practice" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                প্র্যাকটিস টেস্ট (উন্মুক্ত)
              </h2>
              <p className="text-xs text-muted-foreground">
                যেকোনো সময় নিজের সুবিধামতো প্র্যাকটিস করার উন্মুক্ত পরীক্ষাসমূহ
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              মোট {toBanglaDigits(filteredPracticeExams.length)} টি পরীক্ষা
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredPracticeExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {filteredPracticeExams.length === 0 && (
              <div className="col-span-full py-16 sm:py-28 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
                <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-3">
                  <TaskSquare className="size-7 text-muted-foreground" />
                </div>
                <p className="font-bold text-base sm:text-lg text-foreground">
                  {searchQuery
                    ? "আপনার খোঁজা অনুযায়ী কোনো প্র্যাকটিস টেস্ট পাওয়া যায়নি"
                    : "কোনো প্র্যাকটিস টেস্ট পাওয়া যায়নি"}
                </p>
                <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                  {searchQuery
                    ? "অনুগ্রহ করে অন্য নাম দিয়ে অনুসন্ধান করুন।"
                    : "শীঘ্রই নতুন উন্মুক্ত প্র্যাকটিস টেস্ট প্ল্যাটফর্মে যুক্ত করা হবে।"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
