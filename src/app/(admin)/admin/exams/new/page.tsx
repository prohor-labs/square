"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-auth";
import { createExamAction } from "@/lib/actions/admin-exam";
import { getAllBatchesAction } from "@/lib/actions/batch";
import { fromDatetimeLocalToDhakaIso } from "@/lib/date";

export default function NewExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";

  const { data: user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);

  useEffect(() => {
    getAllBatchesAction().then((res) => {
      if (res.success && res.data) {
        setBatches(res.data);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const isFreeExam = formData.get("isFreeExam") === "true";
    const batchId = (formData.get("batchId") as string) || null;
    const type = isFreeExam || !batchId ? "practice" : "chapter_test";
    const durationMinutes = parseInt(
      formData.get("durationMinutes") as string,
      10,
    );
    const totalMarks = parseInt(formData.get("totalMarks") as string, 10);
    const negativeMarking = formData.get("negativeMarking") as string;
    const standard =
      (formData.get("standard") as
        | "HSC"
        | "Varsity"
        | "Engineering"
        | "Medical") || "HSC";
    const showResultImmediately =
      formData.get("showResultImmediately") === "true";
    const isPublished = formData.get("isPublished") === "true";

    const startsAtRaw = (formData.get("startsAt") as string) || "";
    const endsAtRaw = (formData.get("endsAt") as string) || "";

    // The schedule only has somewhere to live when a batch is selected.
    if (batchId && startsAtRaw && endsAtRaw) {
      if (new Date(endsAtRaw) <= new Date(startsAtRaw)) {
        setError("শেষের সময় শুরুর সময়ের পরে হতে হবে");
        setLoading(false);
        return;
      }
    }

    const createdBy = user?.id || "admin";

    const res = await createExamAction({
      title,
      slug,
      description,
      type,
      standard,
      durationMinutes,
      totalMarks,
      negativeMarking,
      showResultImmediately,
      isPublished,
      createdBy,
      batchId,
      startsAt: fromDatetimeLocalToDhakaIso(startsAtRaw),
      endsAt: fromDatetimeLocalToDhakaIso(endsAtRaw),
    });

    if (res.success) {
      router.push(`/admin/exams/${res.data?.id}/questions`);
    } else {
      setError(res.error || "Failed to create exam");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-12 pt-2 md:py-8 gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          নতুন পরীক্ষা তৈরি করুন
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 border p-6 rounded-xl bg-card"
      >
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            পরীক্ষার শিরোনাম
          </label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Physics Chapter 1 MCQ Test"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">
            স্লাগ (Slug)
          </label>
          <Input
            id="slug"
            name="slug"
            required
            placeholder="e.g. physics-ch1-mcq"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            বর্ণনা
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Optional description"
            className="rounded-xl min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="standard" className="text-sm font-medium">
              পরীক্ষার স্ট্যান্ডার্ড / ক্যাটাগরি *
            </label>
            <select
              id="standard"
              name="standard"
              defaultValue="HSC"
              className="w-full h-10 px-3 py-2 rounded-xl border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="HSC">বোর্ড (HSC Board Standard)</option>
              <option value="Varsity">ভার্সিটি (Varsity Admission)</option>
              <option value="Engineering">ইঞ্জিনিয়ারিং (Engineering)</option>
              <option value="Medical">মেডিকেল (Medical Admission)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="batchId" className="text-sm font-medium">
              কোর্স / ব্যাচ নির্বাচন করুন (ঐচ্ছিক)
            </label>
            <select
              id="batchId"
              name="batchId"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-10 px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">কোনো কোর্সে যুক্ত নয় (সরাসরি এক্সাম)</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The schedule is stored on the batch assignment, so it only has
            somewhere to go once a batch is picked. */}
        {selectedBatchId && (
          <div className="space-y-4 border rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">পরীক্ষার সময়সূচি</p>
              <span className="text-[11px] font-medium text-muted-foreground">
                বাংলাদেশ সময় (UTC+6)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startsAt" className="text-sm font-medium">
                  শুরুর সময়
                </label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endsAt" className="text-sm font-medium">
                  শেষের সময়
                </label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  className="rounded-xl"
                />
              </div>
            </div>

            <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
              <li>• দুটো খালি রাখলে পরীক্ষাটি সবসময় লাইভ থাকবে।</li>
              <li>• সময়ের মধ্যে দিলে ফলাফল মেরিট লিস্টে যাবে।</li>
              <li>
                • শুরুর আগে দিতে পারবে না। শেষের পরে দিলে প্র্যাকটিস হিসেবে গণ্য হবে।
              </li>
            </ul>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="durationMinutes" className="text-sm font-medium">
              সময় (মিনিট)
            </label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              required
              min="1"
              placeholder="e.g. 25"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="totalMarks" className="text-sm font-medium">
              মোট মার্কস
            </label>
            <Input
              id="totalMarks"
              name="totalMarks"
              type="number"
              required
              min="1"
              placeholder="e.g. 25"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="negativeMarking" className="text-sm font-medium">
              নেগেটিভ মার্কিং
            </label>
            <Input
              id="negativeMarking"
              name="negativeMarking"
              required
              placeholder="e.g. 0.25"
              defaultValue="0.25"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-muted/50 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isFreeExam"
              value="true"
              defaultChecked
              className="size-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">
              ফ্রি এক্সাম (সবার জন্য উন্মুক্ত)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="showResultImmediately"
              value="true"
              defaultChecked
              className="size-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">সাথেই রেজাল্ট দেখান</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked
              className="size-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">পাবলিশ করুন (Published)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => router.back()}
          >
            বাতিল
          </Button>
          <Button type="submit" className="rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="size-4 mr-2" /> তৈরি হচ্ছে...
              </>
            ) : (
              "পরবর্তী ধাপ (প্রশ্ন যোগ করুন)"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
