import { headers } from "next/headers";
import { LiveExamList } from "@/components/exams/live-exam-list";
import { PracticeExamList } from "@/components/exams/practice-exam-list";
import { UpcomingExamCard } from "@/components/exams/upcoming-exam-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudentExams } from "@/lib/actions/exam";
import { auth } from "@/lib/auth";
import { getExamWindow } from "@/lib/exam-window";

export default async function ExamsBrowserPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab } = (await searchParams) || {};
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  // Free/open exams are deliberately not listed here — only exams scheduled
  // against the student's own batches appear in the three tabs.
  const studentExamsRes = userId ? await getStudentExams(userId) : { data: [] };

  const batchExams = studentExamsRes.data || [];

  // The server clock decides the default tab; the client re-checks the status
  // every second, so a page left open crosses over on its own.
  const now = Date.now();
  const liveCount = batchExams.filter(
    (be) => getExamWindow(be, now).status === "live",
  ).length;
  const upcomingCount = batchExams.filter(
    (be) => getExamWindow(be, now).status === "upcoming",
  ).length;
  const practiceTotal = batchExams.filter(
    (be) => getExamWindow(be, now).status === "practice",
  ).length;

  const defaultTab =
    tab === "practice" || tab === "free"
      ? "practice"
      : tab === "upcoming"
        ? "upcoming"
        : "live";

  const upcomingExams = batchExams.filter(
    (be) => getExamWindow(be, now).status === "upcoming",
  );
  const expiredExams = batchExams.filter(
    (be) => getExamWindow(be, now).status === "practice",
  );

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 sm:pb-24 pt-1 sm:pt-4 gap-4 sm:gap-6 px-2 sm:px-6">
      <Tabs defaultValue={defaultTab} className="w-full space-y-4 sm:space-y-6">
        <div className="w-full border-b pb-2 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="flex items-center justify-start sm:justify-center gap-2 bg-transparent p-0 h-auto min-w-max">
            <TabsTrigger
              value="live"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <span>লাইভ পরীক্ষা</span>
              <span className="bg-red-500/15 text-red-600 dark:text-red-400 font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {liveCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <span>আপকামিং</span>
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {upcomingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="practice"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <span>প্র্যাকটিস</span>
              <span className="bg-muted text-muted-foreground font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {practiceTotal}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Live ─── */}
        <TabsContent
          value="live"
          className="space-y-4 sm:space-y-6 focus-visible:outline-none min-h-[350px] sm:min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              লাইভ পরীক্ষা
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {liveCount} টি চলছে
            </span>
          </div>
          <LiveExamList batchExams={batchExams} />
        </TabsContent>

        {/* ─── Upcoming ─── */}
        <TabsContent
          value="upcoming"
          className="space-y-4 sm:space-y-6 focus-visible:outline-none min-h-[350px] sm:min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold">
              আপকামিং পরীক্ষা
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {upcomingCount} টি অপেক্ষমাণ
            </span>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl text-muted-foreground bg-muted/10 px-4 sm:px-6">
              <p className="font-bold text-base sm:text-lg text-foreground">
                কোনো আপকামিং পরীক্ষা নেই
              </p>
              <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                অ্যাডমিন সময় নির্ধারণ করলে সেটি এখানে দেখা যাবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {upcomingExams.map((be) => (
                <UpcomingExamCard key={be.id} batchExam={be} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Practice ─── */}
        <TabsContent
          value="practice"
          className="space-y-6 sm:space-y-8 focus-visible:outline-none min-h-[380px] sm:min-h-[520px]"
        >
          <div className="flex items-center justify-between pb-1 border-b">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              প্র্যাকটিস পরীক্ষা
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              মোট {practiceTotal} টি
            </span>
          </div>
          <PracticeExamList expiredBatchExams={expiredExams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
