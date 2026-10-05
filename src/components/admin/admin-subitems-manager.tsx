"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_ACTION_CLASS,
  AdminQbFlatCard,
} from "@/components/admin/admin-qb-card";
import { EditChapterForm } from "@/components/admin/forms/edit-chapter-form";
import { NewChapterForm } from "@/components/admin/forms/new-chapter-form";
import { ArrowRight2, Edit, Trash2 } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteSubitemAction as deleteYearAction } from "@/lib/actions/question";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { Container, Item, Subitem } from "@/types";

interface AdminSubitemsManagerProps {
  readonly qb: Container;
  readonly subject: Item;
  readonly initialYears: readonly Subitem[];
}

export function AdminSubitemsManager({
  qb,
  subject,
  initialYears,
}: AdminSubitemsManagerProps) {
  const router = useRouter();
  const [years, setYears] = useState<readonly Subitem[]>(initialYears);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<Subitem | null>(null);

  useEffect(() => {
    setYears(initialYears);
  }, [initialYears]);

  const handleDeleteYear = async (yearId: string) => {
    try {
      const res = await deleteYearAction(yearId, qb.slug, subject.slug);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setYears((prev) => prev.filter((y) => y.id !== yearId));
        toast.success("সালটি সফলভাবে ডিলিট করা হয়েছে");
        router.refresh();
      }
    } catch {
      toast.error("সাল ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
        <Link
          href="/admin/qb"
          className="hover:text-foreground transition-colors"
        >
          প্রশ্নব্যাংকসমূহ
        </Link>
        <ArrowRight2 className="size-3" />
        <Link
          href={`/admin/qb/${qb.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {qb.title}
        </Link>
        <ArrowRight2 className="size-3" />
        <Link
          href={`/admin/qb/${qb.slug}/${subject.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {subject.name}
        </Link>
        <ArrowRight2 className="size-3" />
        <span className="text-foreground font-semibold">সালসমূহ</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {subject.name} - সালসমূহ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            সালে ক্লিক করে টপিক দেখুন, অথবা সাল যোগ, এডিট ও রিমুভ করুন।
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl gap-2 font-bold cursor-pointer"
        >
          + নতুন সাল যোগ করুন
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 max-w-3xl sm:gap-3">
        {years.map((year) => (
          <AdminQbFlatCard
            key={year.id}
            href={`/admin/qb/${qb.slug}/${subject.slug}/${year.slug}`}
            title={year.name}
            meta={`${toBengaliDigits(year.topics?.[0]?.count ?? 0)} টি টপিক${
              year.paper ? ` · ${year.paper} পেপার` : ""
            }`}
            questions={year.questions?.[0]?.count ?? 0}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingYear(year)}
                  className={ADMIN_ACTION_CLASS}
                >
                  <Edit className="size-3.5" />
                  <span>এডিট</span>
                </Button>
                <DeleteConfirmDialog
                  title="সাল ডিলিট নিশ্চিতকরণ"
                  description={`আপনি কি নিশ্চিতভাবে "${year.name}" সালটি ডিলিট করতে চান? এর ভিতরের সব টপিক ও প্রশ্ন মুছে যাবে!`}
                  onConfirm={() => handleDeleteYear(year.id)}
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
        title={`${subject.name} এ নতুন সাল`}
        description="সালের নাম, স্লাগ ও পেপার নির্বাচন করুন।"
        className="sm:max-w-lg"
      >
        <NewChapterForm
          qbSlug={qb.slug}
          subjectId={subject.id}
          subjectSlug={subject.slug}
          onSuccess={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(editingYear)}
        onOpenChange={(open) => {
          if (!open) setEditingYear(null);
        }}
        title="সাল এডিট করুন"
        description="সালের নাম, স্লাগ ও পেপার পরিবর্তন করুন।"
        className="sm:max-w-lg"
      >
        {editingYear && (
          <EditChapterForm
            qbSlug={qb.slug}
            subjectSlug={subject.slug}
            chapter={editingYear}
            onSuccess={() => {
              setEditingYear(null);
              router.refresh();
            }}
            onCancel={() => setEditingYear(null)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
