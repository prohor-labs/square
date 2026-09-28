"use client";

import { useMemo, useState } from "react";
import { TaskSquare } from "@/components/icons";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";
import { ExamCard } from "@/components/shared/exam-card";
import type { FreeExamListItem } from "@/lib/actions/free-exam";

interface FreeExamsClientViewProps {
  readonly examsList: FreeExamListItem[];
}

type TabType = "all" | "board" | "varsity" | "engineering" | "medical";

function matchExamWithTab(exam: FreeExamListItem, tab: TabType): boolean {
  if (tab === "all") return true;

  const std = (exam.standard || "").toLowerCase();
  const title = (exam.title || "").toLowerCase();

  if (tab === "board") {
    return (
      std === "hsc" ||
      std === "board" ||
      title.includes("board") ||
      title.includes("বোর্ড") ||
      title.includes("hsc") ||
      title.includes("ঢাকা") ||
      title.includes("রাজশাহী") ||
      title.includes("কুমিল্লা") ||
      title.includes("চট্টগ্রাম")
    );
  }
  if (tab === "varsity") {
    return (
      std === "varsity" ||
      title.includes("varsity") ||
      title.includes("ভার্সিটি") ||
      title.includes("ঢাবি") ||
      title.includes("রাবি") ||
      title.includes("জাবি") ||
      title.includes("গুচ্ছ") ||
      title.includes("du") ||
      title.includes("ru") ||
      title.includes("ju")
    );
  }
  if (tab === "engineering") {
    return (
      std === "engineering" ||
      title.includes("engineering") ||
      title.includes("ইঞ্জিনিয়ারিং") ||
      title.includes("বুয়েট") ||
      title.includes("buet") ||
      title.includes("ckruet") ||
      title.includes("kuet") ||
      title.includes("ruet") ||
      title.includes("cuet") ||
      title.includes("iut") ||
      title.includes("butex")
    );
  }
  if (tab === "medical") {
    return (
      std === "medical" ||
      title.includes("medical") ||
      title.includes("মেডিকেল") ||
      title.includes("dental") ||
      title.includes("ডেন্টাল") ||
      title.includes("mat") ||
      title.includes("dat")
    );
  }
  return true;
}

export function FreeExamsClientView({ examsList = [] }: FreeExamsClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const counts: Record<TabType, number> = {
      all: examsList.length,
      board: 0,
      varsity: 0,
      engineering: 0,
      medical: 0,
    };

    examsList.forEach((exam) => {
      if (matchExamWithTab(exam, "board")) counts.board++;
      if (matchExamWithTab(exam, "varsity")) counts.varsity++;
      if (matchExamWithTab(exam, "engineering")) counts.engineering++;
      if (matchExamWithTab(exam, "medical")) counts.medical++;
    });

    return counts;
  }, [examsList]);

  const tabs = [
    { id: "all", label: "সকল পরীক্ষা", count: tabCounts.all },
    { id: "board", label: "বোর্ড", count: tabCounts.board },
    { id: "varsity", label: "ভার্সিটি", count: tabCounts.varsity },
    { id: "engineering", label: "ইঞ্জিনিয়ারিং", count: tabCounts.engineering },
    { id: "medical", label: "মেডিকেল", count: tabCounts.medical },
  ];

  const filteredExams = useMemo(() => {
    return examsList.filter((exam) => {
      if (!matchExamWithTab(exam, activeTab as TabType)) return false;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const title = (exam.title || "").toLowerCase();
      const std = (exam.standard || "").toLowerCase();
      return title.includes(query) || std.includes(query);
    });
  }, [examsList, activeTab, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tab Navigation with Search */}
      <CustomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="ফ্রি এক্সাম খুঁজুন..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toBanglaDigits={toBanglaDigits}
      />

      {/* Grid View */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch animate-in fade-in duration-200">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam as any}
              basePath="/free-exam"
            />
          ))}
        </div>
      ) : (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/15 p-6 space-y-3 animate-in fade-in duration-200">
          <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground">
            <TaskSquare className="size-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {searchQuery
              ? "আপনার অনুসন্ধান অনুযায়ী কোনো ফ্রি এক্সাম পাওয়া যায়নি"
              : "এই ক্যাটাগরিতে কোনো ফ্রি এক্সাম পাওয়া যায়নি"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            {searchQuery
              ? "অনুগ্রহ করে অন্য নাম বা কিওয়ার্ড দিয়ে খুঁজুন।"
              : "শীঘ্রই এই ক্যাটাগরির নতুন ফ্রি পরীক্ষা যুক্ত করা হবে।"}
          </p>
        </div>
      )}
    </div>
  );
}

