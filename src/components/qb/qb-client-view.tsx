"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, TickCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";

export interface QbContainerItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly accessType?: string;
  readonly hasAccess?: boolean;
  readonly itemsCount?: number;
  readonly questionsCount?: number;
}

interface QbClientViewProps {
  readonly containers: QbContainerItem[];
}

export function QbClientView({ containers }: QbClientViewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const publicCount = containers.filter((c) => c.accessType === "public").length;
  const enrolledCount = containers.filter(
    (c) => c.accessType === "enrolled" || c.hasAccess
  ).length;

  const tabs = [
    { id: "all", label: "সকল প্রশ্নব্যাংক", count: containers.length },
    ...(enrolledCount > 0
      ? [{ id: "enrolled", label: "আমার কোর্স অন্তর্ভুক্ত", count: enrolledCount }]
      : []),
    ...(publicCount > 0
      ? [{ id: "public", label: "উন্মুক্ত", count: publicCount }]
      : []),
  ];

  const filteredContainers = useMemo(() => {
    return containers.filter((qb) => {
      // Tab filter
      if (activeTab === "enrolled") {
        if (qb.accessType !== "enrolled" && !qb.hasAccess) return false;
      } else if (activeTab === "public") {
        if (qb.accessType !== "public") return false;
      }

      // Search query filter
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const title = (qb.title || "").toLowerCase();
      const desc = (qb.description || "").toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [containers, activeTab, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── Sticky Custom Tab Bar ────────────────────────────────────────── */}
      <CustomTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="প্রশ্নব্যাংক খুঁজুন..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toBanglaDigits={toBanglaDigits}
      />

      {/* ─── Header Information ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            প্রশ্নব্যাংক ব্রাউজার
          </h2>
          <p className="text-xs text-muted-foreground">
            বোর্ড ও এডমিশন স্ট্যান্ডার্ড অধ্যায়ভিত্তিক ও টপিকভিত্তিক প্রশ্ন অনুশীলন করুন
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          মোট {toBanglaDigits(filteredContainers.length)} টি প্রশ্নব্যাংক
        </span>
      </div>

      {/* ─── Question Banks Grid ──────────────────────────────────────────── */}
      {filteredContainers.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5 w-full animate-in fade-in duration-200">
          {filteredContainers.map((qb) => {
            const accessType =
              qb.accessType || (qb.hasAccess ? "enrolled" : "restricted");

            return (
              <Link
                href={`/qb/${qb.slug}`}
                key={qb.id}
                className="block group h-full"
              >
                <div className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-4 sm:p-5 md:p-6 cursor-pointer hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center text-white shadow-md border bg-primary/20 border-border/50">
                  {/* Background Layer with Gradient */}
                  <div className="absolute inset-0 transition-all duration-300 bg-gradient-to-br from-primary via-primary/95 to-primary/85 opacity-95 group-hover:opacity-100 group-hover:scale-105" />

                  {/* Center Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                    <h3 className="font-black text-[16px] sm:text-[19px] md:text-[22px] lg:text-[24px] leading-snug drop-shadow-md text-white line-clamp-3">
                      {qb.title}
                    </h3>

                    {qb.description && (
                      <p className="text-white/90 text-[11px] sm:text-[12px] md:text-xs font-medium mt-1.5 md:mt-2 line-clamp-2 max-w-xs leading-snug">
                        {qb.description}
                      </p>
                    )}

                    <div className="mt-2 sm:mt-3 flex items-center gap-2 text-[10px] sm:text-xs text-white/85 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                      <span>{toBanglaDigits(qb.itemsCount || 0)} টি বিষয়</span>
                      <span>•</span>
                      <span>{toBanglaDigits(qb.questionsCount || 0)} টি প্রশ্ন</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6 animate-in fade-in duration-200">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TickCircle className="size-7" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            {searchQuery
              ? "আপনার অনুসন্ধান অনুযায়ী কোনো প্রশ্নব্যাংক পাওয়া যায়নি"
              : "কোনো প্রশ্নব্যাংক পাওয়া যায়নি"}
          </h3>
          <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
            {searchQuery
              ? "অনুগ্রহ করে অন্য নাম বা কিওয়ার্ড দিয়ে খুঁজুন।"
              : "আপনি বর্তমানে যে সকল কোর্সে সক্রিয় রয়েছেন, শুধুমাত্র সেই কোর্সের অন্তর্ভুক্ত প্রশ্নব্যাংকগুলো এখানে দেখতে পাবেন।"}
          </p>
          {!searchQuery && (
            <Link href="/my-courses" className="mt-4">
              <Button size="sm" className="rounded-xl px-5 font-bold text-xs">
                আমার কোর্সসমূহ দেখুন &rarr;
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
