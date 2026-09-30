import { headers } from "next/headers";
import Link from "next/link";
import { Clock, TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublishedExams, getStudentExams } from "@/lib/actions/exam";
import { auth } from "@/lib/auth";
import { formatBanglaDateTime } from "@/lib/date";

export default async function ExamsBrowserPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab } = (await searchParams) || {};
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [studentExamsRes, publishedExamsRes] = await Promise.all([
    userId ? getStudentExams(userId) : Promise.resolve({ data: [] }),
    getPublishedExams(),
  ]);

  const batchExams = studentExamsRes.data || [];
  const practiceExams = publishedExamsRes.data || [];

  const defaultTab = tab === "practice" || tab === "free" ? "practice" : "batch";

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 sm:pb-24 pt-1 sm:pt-4 gap-4 sm:gap-6 px-2 sm:px-6">
      <Tabs defaultValue={defaultTab} className="w-full space-y-4 sm:space-y-6">
        <div className="w-full border-b pb-2 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="flex items-center justify-start sm:justify-center gap-2 bg-transparent p-0 h-auto min-w-max">
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <span>আমার ব্যাচ</span>
              <span className="bg-primary/10 text-primary font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {batchExams.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="practice"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm text-muted-foreground hover:bg-accent hover:text-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:font-bold transition-all shrink-0 whitespace-nowrap"
            >
              <span>প্র্যাকটিস টেস্ট</span>
              <span className="bg-muted text-muted-foreground font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-[6px]">
                {practiceExams.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="batch"
          className="space-y-4 sm:space-y-6 focus-visible:outline-none min-h-[350px] sm:min-h-[480px]"
        >
          <div className="flex items-center justify-between pb-2 border-b">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold">
              আমার ব্যাচের পরীক্ষা
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              মোট {batchExams.length} টি পরীক্ষা
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {batchExams.map((be) => {
              const exam = be.exam;
              if (!exam) return null;
              return (
                <div
                  key={be.id}
                  className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col justify-between gap-5 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-3">
                    <h3 className="font-bold text-base sm:text-lg leading-snug">
                      {exam.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                        <TaskSquare className="size-3.5 text-primary shrink-0" />{" "}
                        {exam.totalMarks} Marks
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                        <Clock className="size-3.5 text-primary shrink-0" />{" "}
                        {exam.durationMinutes} Min
                      </span>
                    </div>
                  </div>
                  <div className="text-xs bg-muted/30 p-3.5 rounded-xl text-muted-foreground space-y-1.5 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground/80">
                        শুরু:
                      </span>
                      <span>{formatBanglaDateTime(be.startsAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground/80">
                        শেষ:
                      </span>
                      <span>{formatBanglaDateTime(be.endsAt)}</span>
                    </div>
                  </div>
                  <Link href={`/exams/${exam.slug}`} className="mt-auto">
                    <Button className="w-full h-10 rounded-xl text-sm font-semibold">
                      বিস্তারিত ও শুরু করুন &rarr;
                    </Button>
                  </Link>
                </div>
              );
            })}
            {batchExams.length === 0 && (
              <div className="col-span-full py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl text-muted-foreground bg-muted/10 px-4 sm:px-6">
                <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <TaskSquare className="size-6 text-muted-foreground" />
                </div>
                <p className="font-bold text-base sm:text-lg text-foreground">
                  আপনার জন্য কোনো ব্যাচের পরীক্ষা নেই
                </p>
                <p className="text-xs sm:text-sm mt-1.5 text-muted-foreground max-w-md">
                  কোনো নতুন পরীক্ষা আপনার ব্যাচে নির্ধারিত হলে এখানে দেখতে পাবেন।
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="practice"
          className="space-y-6 sm:space-y-8 focus-visible:outline-none min-h-[380px] sm:min-h-[520px]"
        >
          <div className="flex items-center justify-between pb-1 border-b">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              প্র্যাকটিস টেস্ট (সবার জন্য উন্মুক্ত)
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              মোট {practiceExams.length} টি পরীক্ষা
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {practiceExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col justify-between gap-5 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-3">
                  <h3 className="font-bold text-base sm:text-lg leading-snug">
                    {exam.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                      <TaskSquare className="size-3.5 text-primary shrink-0" />{" "}
                      {exam.totalMarks} Marks
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                      <Clock className="size-3.5 text-primary shrink-0" />{" "}
                      {exam.durationMinutes} Min
                    </span>
                  </div>
                </div>
                <Link href={`/exams/${exam.slug}`} className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl text-sm font-semibold border-border/70 hover:border-primary/50"
                  >
                    প্র্যাকটিস শুরু করুন &rarr;
                  </Button>
                </Link>
              </div>
            ))}
            {practiceExams.length === 0 && (
              <div className="col-span-full py-16 sm:py-28 md:py-36 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl sm:rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
                <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl bg-muted/80 flex items-center justify-center mb-3 sm:mb-4">
                  <TaskSquare className="size-6 sm:size-8 text-muted-foreground" />
                </div>
                <p className="font-bold text-base sm:text-xl text-foreground">
                  কোনো প্র্যাকটিস টেস্ট পাওয়া যায়নি
                </p>
                <p className="text-xs sm:text-sm mt-1.5 sm:mt-2 text-muted-foreground max-w-md">
                  শীঘ্রই নতুন উন্মুক্ত প্র্যাকটিস টেস্ট প্ল্যাটফর্মে যোগ করা হবে।
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
