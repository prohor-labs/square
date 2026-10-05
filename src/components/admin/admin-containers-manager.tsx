"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_ACTION_CLASS,
  AdminQbSquareCard,
} from "@/components/admin/admin-qb-card";
import { EditQuestionBankForm } from "@/components/admin/forms/edit-qb-form";
import { NewQuestionBankForm } from "@/components/admin/forms/new-qb-form";
import { Add, Edit, Flash, Trash2 } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteContainerAction } from "@/lib/actions/question";
import { toBengaliDigits } from "@/lib/calendar-date";

/** A container row plus its unit and question counts. */
export interface AdminQbSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly units: number;
  readonly questions: number;
}

interface AdminContainersManagerProps {
  readonly initialQbs: readonly AdminQbSummary[];
}

export function AdminContainersManager({
  initialQbs,
}: AdminContainersManagerProps) {
  const router = useRouter();
  const [qbs, setQbs] = useState<readonly AdminQbSummary[]>(initialQbs);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQb, setEditingQb] = useState<AdminQbSummary | null>(null);

  useEffect(() => {
    setQbs(initialQbs);
  }, [initialQbs]);

  const handleDelete = async (containerId: string) => {
    try {
      const res = await deleteContainerAction(containerId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setQbs((prev) => prev.filter((q) => q.id !== containerId));
        toast.success("প্রশ্নব্যাংক সফলভাবে মুছে ফেলা হয়েছে");
        router.refresh();
      }
    } catch {
      toast.error("প্রশ্নব্যাংক মুছতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black">প্রশ্নব্যাংক তালিকা</h2>
          <p className="text-xs text-muted-foreground">
            ব্যাংক তৈরি করুন, তারপর কার্ডে ক্লিক করে ইউনিট ও সাল সাজান
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            render={<Link href="/admin/qb/add-question" />}
            className="rounded-xl gap-1.5 font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-xs h-10 px-4"
          >
            <Flash className="size-4" />
            <span>এক পেজে প্রশ্ন আপলোড</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="outline"
            className="rounded-xl gap-1.5 font-bold cursor-pointer text-xs h-10 px-4"
          >
            <Add className="size-4" />
            <span>নতুন প্রশ্নব্যাংক</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {qbs.map((qb) => (
          <AdminQbSquareCard
            key={qb.id}
            href={`/admin/qb/${qb.slug}`}
            title={qb.title}
            meta={`${toBengaliDigits(qb.units)} টি ইউনিট`}
            questions={qb.questions}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingQb(qb)}
                  className={ADMIN_ACTION_CLASS}
                >
                  <Edit className="size-3.5" />
                  <span>এডিট</span>
                </Button>
                <DeleteConfirmDialog
                  title="প্রশ্নব্যাংক ডিলিট নিশ্চিতকরণ"
                  description="আপনি কি নিশ্চিত যে এই প্রশ্নব্যাংকটি ডিলিট করতে চান? এর ভিতরের সব ইউনিট, সাল এবং প্রশ্ন মুছে যাবে!"
                  onConfirm={() => handleDelete(qb.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className={ADMIN_ACTION_CLASS}
                    >
                      <Trash2 className="size-3.5" />
                      <span>ডিলিট</span>
                    </Button>
                  }
                />
              </>
            }
          />
        ))}
      </div>

      <ResponsiveDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="নতুন প্রশ্নব্যাংক"
        description="প্রশ্নব্যাংকের শিরোনাম ও বিবরণ লিখুন।"
        className="sm:max-w-lg"
      >
        <NewQuestionBankForm
          onSuccess={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(editingQb)}
        onOpenChange={(open) => {
          if (!open) setEditingQb(null);
        }}
        title="প্রশ্নব্যাংক এডিট করুন"
        description="প্রশ্নব্যাংকের শিরোনাম, slug ও বিবরণ পরিবর্তন করুন।"
        className="sm:max-w-lg"
      >
        {editingQb && (
          <EditQuestionBankForm
            qb={editingQb}
            onSuccess={() => {
              setEditingQb(null);
              router.refresh();
            }}
            onCancel={() => setEditingQb(null)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
