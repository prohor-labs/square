"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import {
  Danger,
  DocumentDownload,
  FileText,
  TickCircle,
  Upload,
} from "@/components/icons";
import { QbFileManager } from "@/components/qb/qb-file-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  importQbRowsAction,
  type QbFileSummary,
} from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import { type ParsedCsvQuestion, parseQuestionsCsv } from "@/lib/csv-parser";
import { cn } from "@/lib/utils";

/** The sheet only needs these columns; the rest are optional. */
const SAMPLE_CSV = `\uFEFFquestion,type,option1,option2,option3,option4,answer,explanation,question_image,option1_image,option2_image,option3_image,option4_image,explanation_image,subject_name,paper_name,chapter_name,topic_name
"নিচের কোনটি ভেক্টর রাশি?","mcq","বেগ","দ্রুতি","কাজ","ক্ষমতা","A","বেগের মান ও দিক দুটোই আছে।",,,,,"","","পদার্থবিজ্ঞান","১ম পত্র","ভেক্টর","ভেক্টরের প্রকারভেদ"
"চিত্রে লব্ধি কত?","mcq","5","8","11","14","A","লব্ধি = কর্ণের মান।","https://example.com/q2.png",,,,"","https://example.com/exp2.png","পদার্থবিজ্ঞান","১ম পত্র","ভেক্টর","লব্ধি"
"নিচের কোনগুলো মৌলিক রাশি?","mcq","দৈর্ঘ্য","বল","সময়","ভর","A,C,D","দৈর্ঘ্য, সময় ও ভর মৌলিক রাশি।",,,,,"","","পদার্থবিজ্ঞান","১ম পত্র","ভৌত রাশি","মৌলিক রাশি"`;

const BATCH_SIZE = 100;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_CHOICES = Array.from({ length: 16 }, (_, index) =>
  String(CURRENT_YEAR - index),
);

interface UploadSummary {
  readonly imported: number;
  readonly skipped: number;
  readonly errors: readonly string[];
  readonly setId?: string | null;
}

export function QbUploader({
  files,
}: {
  readonly files: readonly QbFileSummary[];
}) {
  const uid = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [originalFileName, setOriginalFileName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [year, setYear] = useState("");
  const [unit, setUnit] = useState("");
  const [rows, setRows] = useState<ParsedCsvQuestion[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const universities = [
    ...new Set(files.map((file) => file.university.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "bn"));
  const units = [
    ...new Set(files.map((file) => file.unit.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "bn"));
  const years = [
    ...new Set([
      ...files.map((file) => file.year.trim()).filter(Boolean),
      ...YEAR_CHOICES,
    ]),
  ].sort((a, b) => b.localeCompare(a, "bn"));

  const reset = () => {
    setOriginalFileName("");
    setDisplayName("");
    setUniversity("");
    setYear("");
    setUnit("");
    setRows([]);
    setProgress({ done: 0, total: 0 });
    setSummary(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearSelection = () => {
    setOriginalFileName("");
    setDisplayName("");
    setUniversity("");
    setYear("");
    setUnit("");
    setRows([]);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  const readFile = async (file: File) => {
    reset();

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("শুধু .csv ফাইল দিন।");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseQuestionsCsv(text);

      if (parsed.length === 0) {
        setError(
          "CSV-তে কোনো প্রশ্ন পাওয়া যায়নি। প্রথম লাইনে কলামের নাম (question, option1 …) আছে কি না দেখুন।",
        );
        return;
      }

      setOriginalFileName(file.name);
      setDisplayName(file.name);
      setRows(parsed);
    } catch {
      setError("ফাইলটি পড়া যায়নি। UTF-8 CSV কিনা দেখুন।");
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const upload = async () => {
    if (rows.length === 0 || isUploading) return;

    setIsUploading(true);
    setSummary(null);
    setError(null);
    setProgress({ done: 0, total: rows.length });

    let imported = 0;
    let skipped = 0;
    let setId: string | null = null;
    const errors: string[] = [];
    const file = {
      fileName: displayName.trim() || originalFileName,
      originalFileName,
      university: university.trim(),
      year: year.trim(),
      unit: unit.trim(),
    };

    try {
      for (let index = 0; index < rows.length; index += BATCH_SIZE) {
        const batch = rows.slice(index, index + BATCH_SIZE);
        const result = await importQbRowsAction(
          batch,
          { ...file, setId: setId ?? undefined },
          index,
        );

        imported += result.imported;
        skipped += result.skipped;
        if (result.setId) setId = result.setId;
        errors.push(...result.errors);

        setProgress({
          done: Math.min(index + BATCH_SIZE, rows.length),
          total: rows.length,
        });
      }

      setSummary({ imported, skipped, errors, setId });
      clearSelection();
      router.refresh();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "আপলোড করা যায়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "question-upload-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="rounded-3xl border border-border/80 bg-card p-4 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold sm:text-base">প্রশ্ন আপলোড</h2>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              CSV ফাইল বেছে নিন — প্রতিটি সারি একটি প্রশ্ন। ফাইলের নাম, বিশ্ববিদ্যালয়, বছর
              ও ইউনিট দিয়ে শিক্ষার্থীদের জন্য সাজান।
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSample}
            className="h-8 gap-1.5 rounded-xl text-[11px] font-bold"
          >
            <DocumentDownload className="size-3.5" />
            ডেমো CSV
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readFile(file);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <Upload className="size-6 text-primary" />
          <span className="text-xs font-bold sm:text-sm">
            CSV ফাইল টেনে ছাড়ুন বা ক্লিক করুন
          </span>
          <span className="text-[10px] text-muted-foreground sm:text-[11px]">
            question, option1–5, answer, explanation, *_image, chapter_name,
            topic_name
          </span>
        </button>

        {originalFileName && (
          <div className="mt-3 space-y-3 rounded-2xl border bg-muted/20 p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{originalFileName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {toBengaliDigits(rows.length)} টি প্রশ্ন পড়া হয়েছে
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-name`}>ফাইলের নাম (শিক্ষার্থীরা দেখবে)</Label>
              <Input
                id={`${uid}-name`}
                value={displayName}
                maxLength={200}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="যেমন: ঢাবি ক ইউনিট ২০২৪"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-university`}>বিশ্ববিদ্যালয়</Label>
                <Input
                  id={`${uid}-university`}
                  list={`${uid}-universities`}
                  value={university}
                  maxLength={120}
                  onChange={(event) => setUniversity(event.target.value)}
                  placeholder="যেমন: ঢাবি"
                />
                <datalist id={`${uid}-universities`}>
                  {universities.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-year`}>বছর</Label>
                <select
                  id={`${uid}-year`}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">বছর নির্বাচন</option>
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {toBengaliDigits(value)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-unit`}>ইউনিট</Label>
                <Input
                  id={`${uid}-unit`}
                  list={`${uid}-units`}
                  value={unit}
                  maxLength={80}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="যেমন: ক ইউনিট"
                />
                <datalist id={`${uid}-units`}>
                  {units.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={upload}
                disabled={
                  isUploading || rows.length === 0 || !displayName.trim()
                }
                className="h-8 gap-1.5 rounded-xl text-[11px] font-bold"
              >
                {isUploading ? (
                  <>
                    <Spinner className="size-3.5" />
                    {toBengaliDigits(progress.done)} /{" "}
                    {toBengaliDigits(progress.total)}
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    আপলোড করুন
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] font-semibold text-destructive sm:text-xs">
            <Danger className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        {summary && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] sm:text-xs">
            <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <TickCircle className="size-4 shrink-0" />
              {toBengaliDigits(summary.imported)} টি নতুন প্রশ্ন যোগ হয়েছে
              {summary.skipped > 0 &&
                `, ${toBengaliDigits(summary.skipped)} টি আগে থেকেই ছিল`}
            </p>
            {summary.setId ? (
              <Link
                href={`/qb/file/${summary.setId}`}
                className="mt-1 inline-flex text-[11px] font-bold text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
              >
                আপলোড করা ফাইলটি দেখুন
              </Link>
            ) : null}
            {summary.errors.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-destructive">
                {summary.errors.slice(0, 5).map((message) => (
                  <li key={message}>{message}</li>
                ))}
                {summary.errors.length > 5 && (
                  <li>
                    আরও {toBengaliDigits(summary.errors.length - 5)} টি সমস্যা
                    আছে।
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>

      <QbFileManager files={files} />
    </>
  );
}
