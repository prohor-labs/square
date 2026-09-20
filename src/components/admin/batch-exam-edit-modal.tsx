"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExamEditorModal } from "@/components/admin/exam-editor-modal";
import { Edit, Trash2 } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  removeExamFromBatchAction,
  updateBatchExamAction,
} from "@/lib/actions/batch";
import { fromDatetimeLocalToDhakaIso, toDatetimeLocal } from "@/lib/date";

interface BatchExamEditModalProps {
  batchExam: {
    id: string;
    batchId: string;
    examId: string;
    startsAt?: string | null;
    endsAt?: string | null;
    maxAttempts?: number | null;
    isRequired: boolean;
    exam?: {
      id: string;
      title: string;
      slug: string;
      type: string;
      durationMinutes: number;
      totalMarks: number;
    } | null;
  };
}

export function BatchExamEditModal({ batchExam }: BatchExamEditModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const startsAt = fd.get("startsAt") as string;
    const endsAt = fd.get("endsAt") as string;
    const maxAttempts = fd.get("maxAttempts") as string;
    const isRequired = fd.get("isRequired") === "true";

    const res = await updateBatchExamAction(batchExam.id, batchExam.batchId, {
      startsAt: fromDatetimeLocalToDhakaIso(startsAt),
      endsAt: fromDatetimeLocalToDhakaIso(endsAt),
      maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
      isRequired,
    });

    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error || "আপডেট করতে ব্যর্থ হয়েছে");
      setLoading(false);
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={batchExam.exam?.title || "পরীক্ষা সেটিংস"}
      description="ব্যাচ পরীক্ষার সময়সূচি ও সেটিংস পরিবর্তন করুন"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
        >
          <Edit className="size-4" />
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Exam meta info + full exam editor link */}
        <div className="grid gap-2 text-sm border rounded-xl p-4 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="grid gap-1.5 flex-1">
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground">ধরন:</span>
                <span className="col-span-2 font-medium capitalize">
                  {batchExam.exam?.type?.replace(/_/g, " ") || "—"}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground">সময়:</span>
                <span className="col-span-2 font-medium">
                  {batchExam.exam?.durationMinutes} মিনিট
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-muted-foreground">মোট নম্বর:</span>
                <span className="col-span-2 font-medium">
                  {batchExam.exam?.totalMarks}
                </span>
              </div>
            </div>
            {/* Full exam editor modal */}
            {batchExam.examId && (
              <ExamEditorModal
                examId={batchExam.examId}
                examTitle={batchExam.exam?.title}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs shrink-0 ml-4"
                  >
                    পরীক্ষা এডিট করুন
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Batch-specific scheduling */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startsAt" className="text-sm font-medium">
                শুরুর সময়
              </label>
              <Input
                id="startsAt"
                type="datetime-local"
                name="startsAt"
                defaultValue={toDatetimeLocal(batchExam.startsAt)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endsAt" className="text-sm font-medium">
                শেষের সময়
              </label>
              <Input
                id="endsAt"
                type="datetime-local"
                name="endsAt"
                defaultValue={toDatetimeLocal(batchExam.endsAt)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="maxAttempts" className="text-sm font-medium">
              সর্বোচ্চ প্রচেষ্টা
            </label>
            <Input
              id="maxAttempts"
              type="number"
              name="maxAttempts"
              min={1}
              defaultValue={batchExam.maxAttempts ?? ""}
              placeholder="যেকোনো সংখ্যক"
              className="rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isRequired"
              value="true"
              defaultChecked={batchExam.isRequired}
              className="size-4 rounded"
            />
            <span className="text-sm font-medium">আবশ্যিক পরীক্ষা</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => setOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              className="rounded-xl flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="size-4 mr-2" /> সংরক্ষণ হচ্ছে...
                </>
              ) : (
                "সংরক্ষণ করুন"
              )}
            </Button>
          </div>
        </form>

        {/* Remove from batch */}
        <div className="pt-2 border-t">
          <DeleteConfirmDialog
            title="পরীক্ষা সরানো নিশ্চিতকরণ"
            description={`আপনি কি নিশ্চিত এই ব্যাচ থেকে "${batchExam.exam?.title || "পরীক্ষা"}" সরাতে চান?`}
            onConfirm={async () => {
              await removeExamFromBatchAction(batchExam.id, batchExam.batchId);
              setOpen(false);
              router.refresh();
            }}
            trigger={
              <Button
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2 cursor-pointer"
              >
                <Trash2 className="size-4" />
                ব্যাচ থেকে পরীক্ষা সরান
              </Button>
            }
          />
        </div>
      </div>
    </ResponsiveDialog>
  );
}
