"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  type BackupPreview,
  exportBackupAction,
  inspectBackupAction,
  restoreBackupAction,
} from "@/lib/actions/qb-backup";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/**
 * Backup and restore for the question bank.
 *
 * The file is read in the browser and handed to the server as base64, matching
 * how the other import forms already work — nothing is written to disk in
 * between. The preview step exists because a restore replaces the whole bank:
 * an admin should see what is about to be overwritten before it happens.
 */
export function QbBackupPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [busy, setBusy] = useState<"inspect" | "restore" | "export" | null>(
    null,
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setBusy("inspect");

    try {
      // A zip of the full bank is ~5 MB, which base64 inflates by about a third.
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("ফাইলটি পড়া যায়নি।"));
        reader.readAsDataURL(file);
      });

      const encoded = text.slice(text.indexOf(",") + 1);
      const result = await inspectBackupAction(encoded);
      setBase64(encoded);
      setPreview(result);

      toast.success(
        `ফাইলটি পড়া হয়েছে — ${toBengaliDigits(result.manifest.totalRows)} টি রো`,
      );
    } catch (error) {
      setBase64(null);
      toast.error(error instanceof Error ? error.message : "ফাইলটি পড়া যায়নি।");
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (!base64) return;
    setBusy("restore");

    try {
      const result = await restoreBackupAction(base64);
      if (!result.ok) {
        toast.error(result.error ?? "রিস্টোর করা যায়নি।");
        return;
      }

      const questions = result.written?.questions ?? 0;
      toast.success(
        `${toBengaliDigits(questions)} টি প্রশ্ন ফিরে এসেছে (${result.durationMs} সেকেন্ড)`,
      );
      reset();
      router.refresh();
    } catch {
      toast.error("রিস্টোর করা যায়নি, কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setBusy("export");
    try {
      const result = await exportBackupAction();
      if (!result.ok) {
        toast.error(result.error ?? "ব্যাকআপ নেওয়া যায়নি।");
        return;
      }

      // atob gives bytes; the bytes are what a Blob of type zip needs.
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const url = URL.createObjectURL(
        new Blob([bytes], { type: "application/zip" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${result.fileName} ডাউনলোড হয়েছে`);
    } catch {
      toast.error("ব্যাকআপ নেওয়া যায়নি, কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setBusy(null);
    }
  };

  function reset() {
    setFileName(null);
    setBase64(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Taking a copy — the safe thing to do before touching anything. */}
      <section className="rounded-3xl border border-border/70 bg-card p-5">
        <h3 className="text-base font-black">ব্যাকআপ নিন</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          এখনকার পুরো প্রশ্নব্যাংক zip ফাইল হিসেবে নামিয়ে নিন। কোনো কিছু বদলানোর আগে এটি
          করে রাখুন।
        </p>
        <Button
          onClick={handleExport}
          disabled={busy !== null}
          className="mt-3 cursor-pointer rounded-xl font-bold"
        >
          <Download className="size-4" />
          <span>{busy === "export" ? "তৈরি হচ্ছে…" : "ব্যাকআপ ডাউনলোড করুন"}</span>
        </Button>
      </section>

      {/* Putting a copy back. */}
      <section className="rounded-3xl border border-border/70 bg-card p-5">
        <h3 className="text-base font-black">ব্যাকআপ ফিরিয়ে আনুন</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          আগের zip ফাইলটি এখানে দিন। বর্তমান প্রশ্নব্যাংকের বদলে ফাইলের ডেটা লেখা হবে — একই
          ফাইল বারবার দিলেও একবারের বেশি কোনো প্রশ্ন তৈরি হবে না।
        </p>

        <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm font-bold">
            {busy === "inspect" ? "পড়া হচ্ছে…" : (fileName ?? "zip ফাইল বেছে নিন")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            শুধু question-bank-*.zip ফাইল নেওয়া যাবে
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            disabled={busy !== null}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>

        {preview && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                ফাইলে তৈরি হয়েছে{" "}
                {new Date(preview.manifest.exportedAt).toLocaleString("bn-BD")}{" "}
                · মোট {toBengaliDigits(preview.manifest.totalRows)} টি রো
              </p>

              <ul className="mt-2.5 flex flex-col gap-1">
                {preview.counts
                  .filter((row) => row.inFile > 0 || row.inDatabase > 0)
                  .map((row) => (
                    <li
                      key={row.table}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          row.inFile === row.inDatabase
                            ? "text-emerald-600"
                            : "text-amber-600",
                        )}
                      >
                        {toBengaliDigits(row.inFile)} /{" "}
                        {toBengaliDigits(row.inDatabase)}
                      </span>
                    </li>
                  ))}
              </ul>

              <p className="mt-2.5 text-[11px] text-muted-foreground">
                বাঁ পাশে ফাইলে যত আছে, ডান পাশে এখন ডেটাবেসে তত আছে।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRestore}
                disabled={busy !== null}
                className="cursor-pointer rounded-xl font-bold"
              >
                <Upload className="size-4" />
                <span>
                  {busy === "restore" ? "ফিরিয়ে আনা হচ্ছে…" : "রিস্টোর করুন"}
                </span>
              </Button>

              <Button
                onClick={reset}
                disabled={busy !== null}
                variant="outline"
                className="cursor-pointer rounded-xl font-bold"
              >
                বাতিল
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
