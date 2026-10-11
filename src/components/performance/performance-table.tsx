"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toBengaliDigits } from "@/lib/calendar-date";

export interface PerformanceRow {
  readonly id: string;
  readonly courseName: string;
  readonly examTitle: string;
  readonly examSlug: string;
  readonly score: number;
  readonly totalMarks: number;
  readonly isLive: boolean;
}

const ALL = "all";

/** The attempt table with a course filter on top. */
export function PerformanceTable({
  rows,
}: {
  readonly rows: readonly PerformanceRow[];
}) {
  const [course, setCourse] = useState(ALL);

  const courses = [...new Set(rows.map((r) => r.courseName || "সাধারণ"))].sort();

  const shown =
    course === ALL
      ? rows
      : rows.filter((r) => (r.courseName || "সাধারণ") === course);

  return (
    <div className="flex flex-col gap-3">
      {courses.length > 1 && (
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">কোর্স</span>
          <Select value={course} onValueChange={(v) => setCourse(v ?? ALL)}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="কোর্স নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                কোর্স
              </th>
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                এক্সাম
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                প্রাপ্ত
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                মোট
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                শতাংশ
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const percent =
                r.totalMarks > 0
                  ? Math.round((r.score / r.totalMarks) * 100)
                  : 0;
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 font-medium">
                    {r.courseName || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/exams/${r.examSlug}/result`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {r.examTitle}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right font-black tabular-nums">
                    {toBengaliDigits(r.score)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {toBengaliDigits(r.totalMarks)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">
                    {toBengaliDigits(percent)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
