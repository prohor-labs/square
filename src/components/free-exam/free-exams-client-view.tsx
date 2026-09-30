"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, Flash, TaskSquare, User } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FreeExamListItem } from "@/lib/actions/free-exam";

interface FreeExamsClientViewProps {
  readonly examsList: FreeExamListItem[];
}

type TabType = "all" | "board" | "varsity" | "engineering" | "medical";

const TABS: { id: TabType; label: string }[] = [
  { id: "all", label: "সকল পরীক্ষা" },
  { id: "board", label: "বোর্ড" },
  { id: "varsity", label: "ভার্সিটি" },
  { id: "engineering", label: "ইঞ্জিনিয়ারিং" },
  { id: "medical", label: "মেডিকেল" },
];

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
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const filteredExams = useMemo(() => {
    return examsList.filter((exam) => matchExamWithTab(exam, activeTab));
  }, [examsList, activeTab]);

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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/80 rounded-2xl w-fit flex-wrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Exams Grid */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className="rounded-2xl border-border/70 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group p-4 gap-3.5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {exam.standard === "HSC"
                      ? "বোর্ড"
                      : exam.standard === "Varsity"
                        ? "ভার্সিটি"
                        : exam.standard === "Engineering"
                          ? "ইঞ্জিনিয়ারিং"
                          : exam.standard === "Medical"
                            ? "মেডিকেল"
                            : "ফ্রি এক্সাম"}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <User className="size-3 text-muted-foreground" />
                    <span>{exam.participantsCount} জন</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {exam.title}
                </h3>

                {/* Compact Info Badges */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <span className="px-2 py-0.5 rounded-lg bg-muted/60 font-medium">
                    {exam.durationMinutes} মিনিট
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-muted/60 font-medium">
                    {exam.totalMarks} মার্কস
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive font-medium">
                    -{exam.negativeMarking}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button
                  render={<Link href={`/free-exam/${exam.slug}`} />}
                  size="sm"
                  className="flex-1 rounded-xl font-bold text-xs h-8.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-none cursor-pointer"
                >
                  পরীক্ষা দিন
                </Button>

                <Button
                  render={<Link href={`/free-exam/${exam.slug}/leaderboard`} />}
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-medium text-xs h-8.5 border-border/80 hover:bg-accent cursor-pointer px-3"
                >
                  <Award className="size-3.5 text-amber-500 mr-1" />
                  র‍্যাংক
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl bg-muted/20 p-6 space-y-2">
          <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <TaskSquare className="size-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            এই ট্যাবে কোনো ফ্রি এক্সাম পাওয়া যায়নি
          </h3>
          <p className="text-xs text-muted-foreground">
            শীঘ্রই এই ক্যাটাগরির নতুন ফ্রি পরীক্ষা যুক্ত করা হবে।
          </p>
        </div>
      )}
    </div>
  );
}
