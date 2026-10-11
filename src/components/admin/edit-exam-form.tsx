"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { deleteExamAction, updateExamAction } from "@/lib/actions/admin-exam";
import type { ExamDetail } from "@/types";

interface EditExamFormProps {
  exam: ExamDetail;
  /**
   * Modal mode: called on successful save or cancel.
   * When omitted the form behaves as a standalone page.
   */
  onSuccess?: () => void;
}

export function EditExamForm({ exam, onSuccess }: EditExamFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isModal = Boolean(onSuccess);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const isFreeExam = formData.get("isFreeExam") === "true";
    const type = (isFreeExam ? "practice" : "chapter_test") as
      | "practice"
      | "chapter_test";
    const standard =
      (formData.get("standard") as
        | "HSC"
        | "Varsity"
        | "Engineering"
        | "Medical") || "HSC";
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      type,
      standard,
      durationMinutes: parseInt(formData.get("durationMinutes") as string, 10),
      totalMarks: parseInt(formData.get("totalMarks") as string, 10),
      negativeMarking: formData.get("negativeMarking") as string,
      showResultImmediately: formData.get("showResultImmediately") === "true",
      isPublished: formData.get("isPublished") === "true",
    };

    const res = await updateExamAction(exam.id, data);

    if (res.success) {
      if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push(`/admin/exams/${exam.id}/questions`);
      }
    } else {
      setError(res.error || "পরীক্ষা আপডেট করতে ব্যর্থ হয়েছে");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    const res = await deleteExamAction(exam.id);
    if (res.success) {
      if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push("/admin/exams");
      }
    } else {
      setError(res.error || "পরীক্ষা ডিলিট করতে ব্যর্থ হয়েছে");
      setLoading(false);
    }
  }

  // Standalone page wrapper — adds page-level padding + header
  if (!isModal) {
    return (
      <div className="flex flex-col w-full max-w-2xl mx-auto pb-12 pt-2 md:py-8 gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">এডিট পরীক্ষা</h1>
          <DeleteConfirmDialog
            title="পরীক্ষা ডিলিট নিশ্চিতকরণ"
            description="আপনি কি নিশ্চিতভাবে এই পরীক্ষাটি ডিলিট করতে চান? এই পরীক্ষাটি ও এর সকল প্রশ্ন স্থায়ীভাবে মুছে যাবে।"
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl cursor-pointer"
                disabled={loading}
              >
                পরীক্ষা ডিলিট করুন
              </Button>
            }
          />
        </div>
        <ExamFormFields
          exam={exam}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          onDelete={handleDelete}
          isModal={false}
        />
      </div>
    );
  }

  // Modal mode — no wrapper padding, flat layout
  return (
    <ExamFormFields
      exam={exam}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      onCancel={onSuccess}
      onDelete={handleDelete}
      isModal={true}
    />
  );
}

// ─── Inner form (shared between page and modal) ────────────────────────────

interface ExamFormFieldsProps {
  exam: ExamDetail;
  loading: boolean;
  error: string | null;
  isModal: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  onDelete: () => Promise<void>;
}

function ExamFormFields({
  exam,
  loading,
  error,
  isModal,
  onSubmit,
  onCancel,
  onDelete,
}: ExamFormFieldsProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={
        isModal
          ? "flex flex-col gap-5"
          : "flex flex-col gap-5 border p-6 rounded-xl bg-card"
      }
    >
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          পরীক্ষার শিরোনাম (Title)
        </label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={exam.title}
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
          defaultValue={exam.slug}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          বর্ণনা (Description)
        </label>
        <Textarea
          id="description"
          name="description"
          defaultValue={exam.description || ""}
          className="rounded-xl min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="standard" className="text-sm font-medium">
          পরীক্ষার স্ট্যান্ডার্ড / ক্যাটাগরি *
        </label>
        <select
          id="standard"
          name="standard"
          defaultValue={exam.standard || "HSC"}
          className="w-full h-10 px-3 py-2 rounded-xl border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="HSC">বোর্ড (HSC Board Standard)</option>
          <option value="Varsity">ভার্সিটি (Varsity Admission)</option>
          <option value="Engineering">ইঞ্জিনিয়ারিং (Engineering)</option>
          <option value="Medical">মেডিকেল (Medical Admission)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="durationMinutes" className="text-sm font-medium">
            সময় (মিনিট)
          </label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            required
            defaultValue={exam.durationMinutes}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="totalMarks" className="text-sm font-medium">
            মোট নম্বর (Total Marks)
          </label>
          <Input
            id="totalMarks"
            name="totalMarks"
            type="number"
            required
            defaultValue={exam.totalMarks}
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
            defaultValue={exam.negativeMarking}
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
            defaultChecked={exam.type === "practice"}
            className="size-4 rounded accent-primary"
          />
          <span className="text-sm font-medium">ফ্রি এক্সাম (সবার জন্য উন্মুক্ত)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="showResultImmediately"
            value="true"
            defaultChecked={exam.showResultImmediately}
            className="size-4 rounded accent-primary"
          />
          <span className="text-sm font-medium">সাথেই রেজাল্ট দেখান</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPublished"
            value="true"
            defaultChecked={exam.isPublished}
            className="size-4 rounded accent-primary"
          />
          <span className="text-sm font-medium">পাবলিশ করুন (Published)</span>
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl flex-1"
            onClick={onCancel}
          >
            বাতিল
          </Button>
        )}
        <Button type="submit" className="rounded-xl flex-1" disabled={loading}>
          {loading ? (
            <>
              <Spinner className="size-4 mr-2" /> সংরক্ষণ হচ্ছে...
            </>
          ) : (
            "সংরক্ষণ করুন"
          )}
        </Button>
      </div>

      {/* Delete — only in modal mode (standalone shows it in the page header) */}
      {isModal && (
        <div className="border-t pt-3">
          <DeleteConfirmDialog
            title="পরীক্ষা ডিলিট নিশ্চিতকরণ"
            description="আপনি কি নিশ্চিতভাবে এই পরীক্ষাটি ডিলিট করতে চান? এই পরীক্ষাটি ও এর সকল প্রশ্ন স্থায়ীভাবে মুছে যাবে।"
            onConfirm={onDelete}
            trigger={
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl cursor-pointer"
                disabled={loading}
              >
                পরীক্ষা ডিলিট করুন
              </Button>
            }
          />
        </div>
      )}
    </form>
  );
}
