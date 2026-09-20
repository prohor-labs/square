"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createBatchAction } from "@/lib/actions/batch";

export default function NewBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hscBatchTag, setHscBatchTag] = useState("HSC 26");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createBatchAction(formData);

    if (res.success) {
      router.push("/admin/batches");
    } else {
      setError(res.error || "Failed to create batch");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-12 pt-2 md:py-8 gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          নতুন ব্যাচ তৈরি করুন (New Batch)
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
            ব্যাচের নাম
          </label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. HSC 2026 Science"
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
            placeholder="e.g. hsc-2026-science"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="hscBatch" className="text-sm font-medium flex items-center justify-between">
            <span>HSC Batch / ক্যাটাগরি</span>
            <span className="text-xs text-muted-foreground">ক্লিক করে সিলেক্ট করুন</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            {(["HSC 26", "HSC 27", "Admission"] as const).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setHscBatchTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  hscBatchTag === tag
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <Input
            id="hscBatch"
            name="hscBatch"
            value={hscBatchTag}
            onChange={(e) => setHscBatchTag(e.target.value)}
            required
            placeholder="e.g. HSC 26 / HSC 27 / Admission"
            className="rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            value="true"
            defaultChecked
            className="size-4 rounded border-border text-primary cursor-pointer"
          />
          <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer select-none">
            অবিলম্বে ওয়েবসাইটে প্রকাশ করুন (Publish Course Immediately)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              বর্তমান মূল্য (Price)
            </label>
            <Input
              id="price"
              name="price"
              type="number"
              required
              placeholder="1000"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="originalPrice" className="text-sm font-medium">
              আগের মূল্য (Original Price)
            </label>
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              placeholder="1500"
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">
            Image URL
          </label>
          <Input
            id="image"
            name="image"
            required
            placeholder="https://..."
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
            required
            placeholder="Short description"
            className="rounded-xl min-h-[100px]"
          />
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
              "ব্যাচ তৈরি করুন"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
