"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ADMIN_ACTION_CLASS,
  AdminQbSquareCard,
} from "@/components/admin/admin-qb-card";
import { EditSubjectForm } from "@/components/admin/forms/edit-subject-form";
import { NewSubjectForm } from "@/components/admin/forms/new-subject-form";
import { ArrowRight2, Edit, Trash2 } from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import type { QbContainerNode, QbUnitNode } from "@/lib/actions/qb-nav";
import { deleteItemAction as deleteUnitAction } from "@/lib/actions/question";
import { toBengaliDigits } from "@/lib/calendar-date";

interface AdminItemsManagerProps {
  readonly qb: QbContainerNode;
  readonly initialUnits: readonly QbUnitNode[];
}

export function AdminItemsManager({
  qb,
  initialUnits,
}: AdminItemsManagerProps) {
  const router = useRouter();
  const [units, setUnits] = useState<readonly QbUnitNode[]>(initialUnits);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<QbUnitNode | null>(null);

  useEffect(() => {
    setUnits(initialUnits);
  }, [initialUnits]);

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const res = await deleteUnitAction(unitId, qb.slug);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
        toast.success("ইউনিটটি সফলভাবে ডিলিট করা হয়েছে");
        router.refresh();
      }
    } catch {
      toast.error("ইউনিট ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link
          href="/admin/qb"
          className="hover:text-foreground transition-colors"
        >
          প্রশ্নব্যাংকসমূহ
        </Link>
        <ArrowRight2 className="size-3" />
        <span className="text-foreground font-semibold">{qb.title}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {qb.title} - ইউনিটসমূহ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ইউনিটে ক্লিক করে সাল দেখুন, অথবা ইউনিট যোগ, এডিট ও রিমুভ করুন।
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl gap-2 font-bold cursor-pointer"
        >
          + নতুন ইউনিট যোগ করুন
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {units.map((unit) => (
          <AdminQbSquareCard
            key={unit.id}
            href={`/admin/qb/${qb.slug}/${unit.slug}`}
            title={unit.name}
            meta={`${toBengaliDigits(unit.chapters.length)} টি সাল`}
            questions={unit.questions}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingUnit(unit)}
                  className={ADMIN_ACTION_CLASS}
                >
                  <Edit className="size-3.5" />
                  <span>এডিট</span>
                </Button>
                <DeleteConfirmDialog
                  title="ইউনিট ডিলিট নিশ্চিতকরণ"
                  description={`আপনি কি নিশ্চিতভাবে "${unit.name}" ইউনিটটি ডিলিট করতে চান? এর ভিতরের সব সাল ও প্রশ্ন মুছে যাবে!`}
                  onConfirm={() => handleDeleteUnit(unit.id)}
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
        title={`${qb.title} এ নতুন ইউনিট`}
        description="ইউনিটের আইডি, নাম ও স্লাগ লিখুন।"
        className="sm:max-w-lg"
      >
        <NewSubjectForm
          qbId={qb.id}
          qbSlug={qb.slug}
          onSuccess={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(editingUnit)}
        onOpenChange={(open) => {
          if (!open) setEditingUnit(null);
        }}
        title="ইউনিট এডিট করুন"
        description="ইউনিটের নাম, স্লাগ ও কোড পরিবর্তন করুন।"
        className="sm:max-w-lg"
      >
        {editingUnit && (
          <EditSubjectForm
            qbSlug={qb.slug}
            subject={editingUnit}
            onSuccess={() => {
              setEditingUnit(null);
              router.refresh();
            }}
            onCancel={() => setEditingUnit(null)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
