"use client";

import { BatchClassesTab } from "@/components/admin/batch-classes-tab";
import { BatchExamsTab } from "@/components/admin/batch-exams-tab";
import { BatchMembersTab } from "@/components/admin/batch-members-tab";
import { BatchPdfsTab } from "@/components/admin/batch-pdfs-tab";
import { BatchSettingsTab } from "@/components/admin/batch-settings-tab";
import {
  Edit,
  FileText,
  Profile2user,
  TaskSquare,
  Trash2,
  Video,
} from "@/components/icons";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteBatchAction } from "@/lib/actions/batch";
import type { BatchDetail } from "@/types";

export function BatchDetailView({ batch }: { batch: BatchDetail }) {
  const members = (batch.members || []) as unknown as Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: { name: string; email: string };
  }>;

  const batchExams = batch.batchExams || [];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 pt-2 md:py-8 gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {batch.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            স্লাগ: {batch.slug} | স্ট্যাটাস: {batch.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DeleteConfirmDialog
            title="ব্যাচ ডিলিট নিশ্চিতকরণ"
            description={`আপনি কি নিশ্চিত যে "${batch.name}" ব্যাচটি স্থায়ীভাবে ডিলিট করতে চান? এর সাথে যুক্ত সকল এক্সাম, মেম্বার ও ডাটা মুছে যাবে!`}
            onConfirm={async () => {
              const res = await deleteBatchAction(batch.id);
              if (res.error) {
                alert(res.error);
              } else {
                window.location.href = "/admin/batches";
              }
            }}
            trigger={
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Trash2 className="size-4" />
                <span>ব্যাচ ডিলিট করুন</span>
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full space-y-6">
        <div className="w-full border-b pb-2 overflow-x-auto no-scrollbar">
          <TabsList className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 bg-transparent p-0 h-auto min-w-max mx-auto">
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <Edit className="size-4 shrink-0" />
              <span>কোর্স সেটিংস ও বিস্তারিত</span>
            </TabsTrigger>

            <TabsTrigger
              value="classes"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <Video className="size-4 shrink-0" />
              <span>ক্লাস ও লেকচার</span>
            </TabsTrigger>

            <TabsTrigger
              value="pdfs"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <FileText className="size-4 shrink-0" />
              <span>পিডিএফ রিসোর্স</span>
            </TabsTrigger>

            <TabsTrigger
              value="exams"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <TaskSquare className="size-4 shrink-0" />
              <span>পরীক্ষাসমূহ</span>
              <span className="bg-muted text-muted-foreground font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {batchExams.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="members"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <Profile2user className="size-4 shrink-0" />
              <span>সদস্যবৃন্দ</span>
              <span className="bg-primary/10 text-primary font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {members.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings">
          <BatchSettingsTab batch={batch} />
        </TabsContent>

        <TabsContent value="classes">
          <BatchClassesTab batchId={batch.id} />
        </TabsContent>

        <TabsContent value="pdfs">
          <BatchPdfsTab batchId={batch.id} />
        </TabsContent>

        <TabsContent value="exams">
          <BatchExamsTab batchId={batch.id} batchExams={batchExams} />
        </TabsContent>

        <TabsContent value="members">
          <BatchMembersTab batchId={batch.id} members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
