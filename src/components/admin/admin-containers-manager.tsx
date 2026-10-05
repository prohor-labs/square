"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EditQuestionBankForm } from "@/components/admin/forms/edit-qb-form";
import { NewQuestionBankForm } from "@/components/admin/forms/new-qb-form";
import { QuickList, type QuickListItem } from "@/components/admin/quick-list";
import { Add, BookOpen, Edit, Flash, Trash2 } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteContainerAction } from "@/lib/actions/question";
import type { Container } from "@/types";

interface AdminContainersManagerProps {
  readonly initialQbs: readonly Container[];
}

export function AdminContainersManager({
  initialQbs,
}: AdminContainersManagerProps) {
  const router = useRouter();
  const [qbs, setQbs] = useState<readonly Container[]>(initialQbs);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQb, setEditingQb] = useState<Container | null>(null);

  // Sync initialQbs when prop updates
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
        toast.success("প্রশ্নব্যাংক সফলভাবে মুছে ফেলা হয়েছে");
        router.refresh();
      }
    } catch {
      toast.error("প্রশ্নব্যাংক মুছতে সমস্যা হয়েছে।");
    }
  };

  const items: QuickListItem[] = qbs.map((qb: Container) => ({
    href: `/admin/qb/${qb.slug}`,
    title: qb.title,
    icon: BookOpen,
    text: "text-primary",
    iconBg: "bg-primary/10",
    extra: (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 font-medium text-xs text-muted-foreground">
          {qb.items?.[0]?.count ?? 0} টি বিষয়
        </span>
      </div>
    ),
    rightElement: (
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditingQb(qb);
          }}
          className="text-primary hover:bg-primary/10 gap-1 rounded-xl text-xs cursor-pointer"
        >
          <Edit className="size-3.5" />
          <span>এডিট</span>
        </Button>
        <DeleteConfirmDialog
          title="প্রশ্নব্যাংক ডিলিট নিশ্চিতকরণ"
          description="আপনি কি নিশ্চিত যে এই প্রশ্নব্যাংকটি ডিলিট করতে চান? এর ভিতরের সব বিষয়, অধ্যায় এবং প্রশ্ন মুছে যাবে!"
          onConfirm={() => handleDelete(qb.id)}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-destructive hover:bg-destructive/10 gap-1 rounded-xl text-xs cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>ডিলিট</span>
            </Button>
          }
        />
      </div>
    ),
  }));

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black">প্রশ্নব্যাংক তালিকা</h2>
          <p className="text-xs text-muted-foreground">
            সকল ক্যাটাগরি ও প্রশ্নব্যাংক পরিচালনা করুন
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

      <QuickList items={items} columns={{ sm: 1, lg: 2 }} gap="md" />

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
