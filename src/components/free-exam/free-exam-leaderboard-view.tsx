"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft2,
  Award,
  Clock,
  Crown,
  Flash,
  Search,
  TaskSquare,
  Trophy,
  User,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { LeaderboardEntry } from "@/types";

interface FreeExamLeaderboardViewProps {
  slug: string;
  exam: {
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    totalMarks: number;
  };
  leaderboard: LeaderboardEntry[];
}

export function FreeExamLeaderboardView({
  slug,
  exam,
  leaderboard = [],
}: FreeExamLeaderboardViewProps) {
  const [search, setSearch] = useState("");

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter(
      (entry) =>
        entry.userName.toLowerCase().includes(q) ||
        (entry.college && entry.college.toLowerCase().includes(q)),
    );
  }, [leaderboard, search]);

  const top3 = leaderboard.slice(0, 3);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} মি. ${s} সে.`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/free-exam/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="p-1.5 rounded-xl border border-border/80 group-hover:border-foreground transition-all bg-card shadow-2xs">
            <ArrowLeft2 className="size-3.5" />
          </div>
          <span>পরীক্ষার পেজে ফিরে যান</span>
        </Link>

        <Button
          render={<Link href={`/free-exam/${slug}`} />}
          className="rounded-2xl font-black text-xs h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-2"
        >
          <Flash className="size-4" />
          <span>নিজে পরীক্ষা দিন (ফ্রি)</span>
        </Button>
      </div>

      {/* Header Banner */}
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-extrabold uppercase tracking-wide">
          <Trophy className="size-4" />
          <span>লাইভ মেধা তালিকা ও র‍্যাংকিং</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          {exam.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
          মোট অংশগ্রহণকারী: <strong className="text-foreground">{leaderboard.length} জন</strong> | পূর্ণমান: {exam.totalMarks} মার্কস
        </p>
      </div>

      {/* Top 3 Podium (If participants exist) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          {top3[1] ? (
            <div className="order-2 sm:order-1 p-5 rounded-3xl bg-card border border-border/80 text-center flex flex-col items-center justify-between gap-3 shadow-xs hover:border-slate-400 transition-colors">
              <div className="space-y-1">
                <div className="size-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-lg flex items-center justify-center mx-auto shadow-2xs">
                  ২
                </div>
                <h3 className="font-extrabold text-sm text-foreground line-clamp-1 mt-2">
                  {top3[1].userName}
                </h3>
                {top3[1].college && top3[1].college !== "N/A" && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
                    {top3[1].college}
                  </p>
                )}
              </div>

              <div className="w-full pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                  স্কোর: {top3[1].score}/{top3[1].totalMarks}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatTime(top3[1].timeTakenSeconds)}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden sm:block order-1" />
          )}

          {/* Rank 1 (Gold / Champion) */}
          {top3[0] && (
            <div className="order-1 sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/15 via-card to-card border-2 border-amber-500/40 text-center flex flex-col items-center justify-between gap-3 shadow-md sm:-translate-y-2">
              <div className="space-y-1">
                <div className="size-14 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                  <Crown className="size-7" />
                </div>
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full mt-1">
                  চ্যাম্পিয়ন • Rank 1
                </span>
                <h3 className="font-black text-base text-foreground line-clamp-1 pt-1">
                  {top3[0].userName}
                </h3>
                {top3[0].college && top3[0].college !== "N/A" && (
                  <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                    {top3[0].college}
                  </p>
                )}
              </div>

              <div className="w-full pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  স্কোর: {top3[0].score}/{top3[0].totalMarks}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatTime(top3[0].timeTakenSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] ? (
            <div className="order-3 p-5 rounded-3xl bg-card border border-border/80 text-center flex flex-col items-center justify-between gap-3 shadow-xs hover:border-amber-700/40 transition-colors">
              <div className="space-y-1">
                <div className="size-12 rounded-2xl bg-amber-700/15 text-amber-800 dark:text-amber-300 font-black text-lg flex items-center justify-center mx-auto shadow-2xs">
                  ৩
                </div>
                <h3 className="font-extrabold text-sm text-foreground line-clamp-1 mt-2">
                  {top3[2].userName}
                </h3>
                {top3[2].college && top3[2].college !== "N/A" && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
                    {top3[2].college}
                  </p>
                )}
              </div>

              <div className="w-full pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-700 dark:text-amber-400">
                  স্কোর: {top3[2].score}/{top3[2].totalMarks}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatTime(top3[2].timeTakenSeconds)}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden sm:block order-3" />
          )}
        </div>
      )}

      {/* Full Merit List Table */}
      <Card className="rounded-3xl border-border/80 bg-card overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-foreground">
              সম্পূর্ণ মেধা তালিকা
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              স্কোর এবং সময় অনুযায়ী স্বয়ংক্রিয়ভাবে সাজানো
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="শিক্ষার্থী বা কলেজের নাম খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-xs h-9 bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 border-b border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">র‍্যাংক</th>
                    <th className="py-3.5 px-4">শিক্ষার্থীর নাম ও প্রতিষ্ঠান</th>
                    <th className="py-3.5 px-4 text-center">স্কোর</th>
                    <th className="py-3.5 px-4 text-center">ব্যয়িত সময়</th>
                    <th className="py-3.5 px-4 text-right hidden sm:table-cell">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLeaderboard.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr
                        key={entry.userId + entry.rank}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          isTop1 ? "bg-amber-500/5 font-semibold" : "",
                        )}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center size-7 rounded-lg text-xs font-black",
                              isTop1
                                ? "bg-amber-500 text-white shadow-2xs"
                                : isTop2
                                  ? "bg-slate-200 dark:bg-slate-700 text-foreground"
                                  : isTop3
                                    ? "bg-amber-700/20 text-amber-700 dark:text-amber-300"
                                    : "bg-muted text-muted-foreground",
                            )}
                          >
                            {entry.rank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0">
                              <User className="size-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">
                                {entry.userName}
                              </span>
                              {entry.college && entry.college !== "N/A" && (
                                <span className="text-[11px] text-muted-foreground">
                                  {entry.college}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-sm text-primary">
                            {entry.score}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            /{entry.totalMarks}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center text-xs font-medium text-muted-foreground">
                          {formatTime(entry.timeTakenSeconds)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-xs text-muted-foreground hidden sm:table-cell">
                          {entry.submittedAt
                            ? new Date(entry.submittedAt).toLocaleDateString("bn-BD")
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <TaskSquare className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-bold">এখনও কোনো সাবমিশন পাওয়া যায়নি।</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
