"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QbExamType } from "@/db/schema";
import type { QbMetaInput } from "@/lib/qb-meta-write";
import { cn } from "@/lib/utils";

const EXAM_TYPES: readonly {
  readonly value: QbExamType;
  readonly label: string;
  /** The institute label reads differently for a board than a university. */
  readonly institute: string;
  readonly instituteHint: string;
  readonly wantsGroup: boolean;
  readonly wantsUnit: boolean;
  readonly wantsYear: boolean;
}[] = [
  {
    value: "board",
    label: "বোর্ড",
    institute: "বোর্ড",
    instituteHint: "যেমন: ঢাকা বোর্ড",
    wantsGroup: true,
    wantsUnit: false,
    wantsYear: true,
  },
  {
    value: "university",
    label: "বিশ্ববিদ্যালয়",
    institute: "বিশ্ববিদ্যালয়",
    instituteHint: "যেমন: ঢাকা বিশ্ববিদ্যালয়",
    wantsGroup: true,
    wantsUnit: true,
    wantsYear: true,
  },
  {
    value: "engineering",
    label: "ইঞ্জিনিয়ারিং",
    institute: "প্রকৌশল বিশ্ববিদ্যালয়",
    instituteHint: "যেমন: কুয়েট",
    wantsGroup: true,
    wantsUnit: true,
    wantsYear: true,
  },
  {
    value: "medical",
    label: "মেডিকেল",
    institute: "মেডিকেল বিশ্ববিদ্যালয়",
    instituteHint: "যেমন: ঢাবি মেডিকেল",
    wantsGroup: false,
    wantsUnit: false,
    wantsYear: true,
  },
  {
    value: "other",
    label: "অন্যান্য",
    institute: "সংস্থার নাম",
    instituteHint: "যেমন: বাংলাদেশ কারিগরি শিক্ষা বোর্ড",
    wantsGroup: false,
    wantsUnit: false,
    wantsYear: true,
  },
];

const GROUPS = ["Science", "Humanities", "Commerce"];
const PAPERS = ["১ম পত্র", "২য় পত্র", "৩য় পত্র"];

/**
 * The metadata an upload is filed under.
 *
 * Nothing is looked up in a list: the admin types the university, subject or
 * chapter and the save creates whatever is missing, so a new subject appears
 * on the site without a code change. Every field is optional — a question can
 * still be uploaded with only the exam type filled in.
 */
export function QbMetadataPanel({
  value,
  onChange,
}: {
  readonly value: QbMetaInput;
  readonly onChange: (next: QbMetaInput) => void;
}) {
  const [examType, setExamType] = useState<QbExamType | "">(
    value.examType ?? "",
  );

  const spec = EXAM_TYPES.find((item) => item.value === examType);
  const set = (patch: Partial<QbMetaInput>) => onChange({ ...value, ...patch });

  const chooseType = (next: QbExamType) => {
    setExamType(next);
    // Switching type clears the fields that no longer apply, so a board never
    // ends up carrying a leftover university unit.
    onChange({
      examType: next,
      instituteName: value.instituteName,
      groupName: spec?.wantsGroup ? value.groupName : "",
      unitName: spec?.wantsUnit ? value.unitName : "",
      year: value.year,
      subjectName: value.subjectName,
      subjectPaper: value.subjectPaper,
      chapterName: value.chapterName,
    });
  };

  return (
    <Card className="rounded-2xl border-border/70">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="space-y-0.5">
          <h3 className="font-bold">প্রশ্নের তথ্য</h3>
          <p className="text-xs text-muted-foreground">
            একবার এখানে তথ্য দিলেই প্রশ্নটি প্রশ্নব্যাংক ও বিষয়ভিত্তিক অংশ — দুই জায়গাতেই
            একসাথে দেখা যাবে।
          </p>
        </div>

        {/* Exam type first — it decides which fields follow. */}
        <div className="space-y-1.5">
          <Label htmlFor="qb-exam-type">পরীক্ষার ধরন</Label>
          <Select
            value={examType}
            onValueChange={(v) => v && chooseType(v as QbExamType)}
          >
            <SelectTrigger id="qb-exam-type" className="h-11 rounded-xl">
              <SelectValue placeholder="নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {spec && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qb-institute">{spec.institute}</Label>
              <Input
                id="qb-institute"
                value={value.instituteName ?? ""}
                onChange={(e) => set({ instituteName: e.target.value })}
                placeholder={spec.instituteHint}
                className="h-11 rounded-xl"
              />
            </div>

            {spec.wantsYear && (
              <div className="space-y-1.5">
                <Label htmlFor="qb-year">সাল</Label>
                <Input
                  id="qb-year"
                  value={value.year ?? ""}
                  onChange={(e) => set({ year: e.target.value })}
                  placeholder="যেমন: ২০২৫ বা ২০২৪-২৫"
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            {spec.wantsGroup && (
              <div className="space-y-1.5">
                <Label htmlFor="qb-group">বিভাগ</Label>
                <Select
                  value={value.groupName || "__none"}
                  onValueChange={(v) =>
                    set({ groupName: v === "__none" ? "" : v })
                  }
                >
                  <SelectTrigger id="qb-group" className="h-11 rounded-xl">
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">নির্বাচন করা হয়নি</SelectItem>
                    {GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {spec.wantsUnit && (
              <div className="space-y-1.5">
                <Label htmlFor="qb-unit">ইউনিট</Label>
                <Input
                  id="qb-unit"
                  value={value.unitName ?? ""}
                  onChange={(e) => set({ unitName: e.target.value })}
                  placeholder="যেমন: A ইউনিট"
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="qb-subject">বিষয়</Label>
              <Input
                id="qb-subject"
                value={value.subjectName ?? ""}
                onChange={(e) => set({ subjectName: e.target.value })}
                placeholder="যেমন: পদার্থবিজ্ঞান"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qb-paper">পত্র</Label>
              <Select
                value={value.subjectPaper || "__none"}
                onValueChange={(v) =>
                  set({ subjectPaper: v === "__none" ? "" : v })
                }
              >
                <SelectTrigger id="qb-paper" className="h-11 rounded-xl">
                  <SelectValue placeholder="নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">পত্র নেই</SelectItem>
                  {PAPERS.map((paper) => (
                    <SelectItem key={paper} value={paper}>
                      {paper}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="qb-chapter">অধ্যায়</Label>
              <Input
                id="qb-chapter"
                value={value.chapterName ?? ""}
                onChange={(e) => set({ chapterName: e.target.value })}
                placeholder={
                  value.subjectName
                    ? `${value.subjectName}-এর অধ্যায় লিখুন`
                    : "অধ্যায় লিখতে হলে আগে বিষয় দিন"
                }
                disabled={!value.subjectName}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        )}

        <p
          className={cn(
            "rounded-xl border p-3 text-[11px]",
            examType
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-dashed border-border text-muted-foreground",
          )}
        >
          {examType
            ? "সংরক্ষণ করলে নতুন বিষয় বা অধ্যায় লিখলে সেটি সাথে সাথেই প্রশ্নব্যাংকে যোগ হবে।"
            : "পরীক্ষার ধরন বেছে নিলে বাকি ঘরগুলো দেখা যাবে।"}
        </p>
      </CardContent>
    </Card>
  );
}
