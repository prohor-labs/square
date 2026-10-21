"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Edit, Eye, FileText } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  type QbFileSummary,
  updateQbFileAction,
} from "@/lib/actions/qb-uploads";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const FALLBACK_YEARS = Array.from({ length: 16 }, (_, index) =>
  String(CURRENT_YEAR - index),
);

function yearOptions(files: readonly QbFileSummary[]): string[] {
  return [
    ...new Set([
      ...files.map((file) => file.year.trim()).filter(Boolean),
      ...FALLBACK_YEARS,
    ]),
  ].sort((a, b) => b.localeCompare(a, "bn"));
}

function universityOptions(files: readonly QbFileSummary[]): string[] {
  return [
    ...new Set(files.map((file) => file.university.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "bn"));
}

function unitOptions(files: readonly QbFileSummary[]): string[] {
  return [
    ...new Set(files.map((file) => file.unit.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "bn"));
}

export function QbFileManager({
  files,
}: {
  readonly files: readonly QbFileSummary[];
}): React.ReactElement {
  const [editing, setEditing] = useState<QbFileSummary | null>(null);

  return (
    <section className="rounded-3xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">আপলোড করা ফাইল</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            প্রতিটি ফাইলের নাম, বিশ্ববিদ্যালয়, বছর ও ইউনিট এখান থেকে বদলানো যাবে।
            শিক্ষার্থীরা এই ফাইলগুলোকে ওই তিনটি ভাগে দেখতে পাবে।
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {toBengaliDigits(files.length)} টি ফাইল
        </span>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center">
          <FileText className="mx-auto size-7 text-muted-foreground/70" />
          <p className="mt-3 text-sm font-bold">এখনো কোনো ফাইল আপলোড হয়নি</p>
          <p className="mt-1 text-xs text-muted-foreground">
            উপরের CSV ফাইলটি আপলোড করলে এখানে নাম, বছর ও ইউনিটসহ দেখা যাবে।
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="rounded-2xl border bg-background/60 p-3 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      {file.fileName}
                    </p>
                    {file.originalFileName &&
                    file.originalFileName !== file.fileName ? (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        মূল ফাইল: {file.originalFileName}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">
                        {file.university || "বিশ্ববিদ্যালয় নেই"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">
                        {file.year ? toBengaliDigits(file.year) : "বছর নেই"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">
                        {file.unit || "ইউনিট নেই"}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                        {toBengaliDigits(file.questionCount)} টি প্রশ্ন
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/qb/${file.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1.5",
                    )}
                  >
                    <Eye className="size-3.5" />
                    দেখুন
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${file.fileName} সম্পাদনা করুন`}
                    onClick={() => setEditing(file)}
                  >
                    <Edit />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <QbFileEditDialog
          file={editing}
          files={files}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function QbFileEditDialog({
  file,
  files,
  onClose,
}: {
  readonly file: QbFileSummary;
  readonly files: readonly QbFileSummary[];
  readonly onClose: () => void;
}): React.ReactElement {
  const uid = useId();
  const router = useRouter();
  const [fileName, setFileName] = useState(file.fileName);
  const [university, setUniversity] = useState(file.university);
  const [year, setYear] = useState(file.year);
  const [unit, setUnit] = useState(file.unit);
  const [error, setError] = useState("");
  const [isSaving, startSaving] = useTransition();

  const years = yearOptions(files);
  const universities = universityOptions(files);
  const units = unitOptions(files);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");

    startSaving(async () => {
      const result = await updateQbFileAction({
        id: file.id,
        fileName,
        university,
        year,
        unit,
      });

      if (!result.ok) {
        setError(result.error || "ফাইলটি সংরক্ষণ করা যায়নি।");
        return;
      }

      toast.success("ফাইলের তথ্য সংরক্ষণ হয়েছে।");
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ফাইলের তথ্য সম্পাদনা</DialogTitle>
          <DialogDescription>
            শিক্ষার্থীরা এই নাম ও বিশ্ববিদ্যালয়/বছর/ইউনিট অনুযায়ী ফাইলটি দেখবে।
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {file.originalFileName ? (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              মূল আপলোড:{" "}
              <span className="font-semibold text-foreground">
                {file.originalFileName}
              </span>
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-name`}>ফাইলের নাম</Label>
            <Input
              id={`${uid}-name`}
              value={fileName}
              maxLength={200}
              onChange={(event) => setFileName(event.target.value)}
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
                placeholder="ঢাবি"
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
                placeholder="ক ইউনিট"
              />
              <datalist id={`${uid}-units`}>
                {units.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onClose}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner className="size-4" /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
