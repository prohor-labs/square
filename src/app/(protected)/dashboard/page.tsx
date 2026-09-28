import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight2,
  Award,
  BookOpen,
  CalendarTick,
  Clock,
  DocumentDownload,
  FileText,
  Flame,
  Lock,
  Star,
  TaskSquare,
  Teacher,
  TickCircle,
  Trophy,
  User,
} from "@/components/icons";
import { CourseCard } from "@/components/shared/course-card";
import { ExamCard } from "@/components/shared/exam-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import {
  batchEnrollments,
  batchExams,
  batchMembers,
  batches,
  examSubmissions,
  exams,
} from "@/db/schema";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const userId = user?.id;

  // 1. Fetch Question Banks with real access status
  const userContainers = await getUserQbContainers(userId);
  const displayContainers = userContainers
    .filter((c) => c.hasAccess || c.isAdmin)
    .slice(0, 4);

  // 2. Fetch User's Enrolled Batches
  let userEnrolledBatchIds: string[] = [];
  let userEnrolledCourses: (typeof batches.$inferSelect)[] = [];

  if (userId) {
    const [enrollments, memberships] = await Promise.all([
      db
        .select({
          course: batches,
        })
        .from(batchEnrollments)
        .innerJoin(batches, eq(batchEnrollments.batchId, batches.id))
        .where(
          and(
            eq(batchEnrollments.userId, userId),
            eq(batchEnrollments.status, "active")
          )
        ),
      db
        .select({
          course: batches,
        })
        .from(batchMembers)
        .innerJoin(batches, eq(batchMembers.batchId, batches.id))
        .where(
          and(
            eq(batchMembers.userId, userId),
            eq(batchMembers.status, "active")
          )
        ),
    ]);

    const courseMap = new Map<string, typeof batches.$inferSelect>();
    for (const e of enrollments) {
      if (e.course) courseMap.set(e.course.id, e.course);
    }
    for (const m of memberships) {
      if (m.course) courseMap.set(m.course.id, m.course);
    }

    userEnrolledCourses = Array.from(courseMap.values());
    userEnrolledBatchIds = Array.from(courseMap.keys());
  }

  // 3. User stats & submissions count
  let userSubmissionsCount = 0;
  if (userId) {
    const userSubmissions = await db
      .select({ id: examSubmissions.id })
      .from(examSubmissions)
      .where(eq(examSubmissions.userId, userId));
    userSubmissionsCount = userSubmissions.length;
  }

  // 4. Featured / Enrolled Courses
  const featuredCourses =
    userEnrolledCourses.length > 0
      ? userEnrolledCourses.slice(0, 3)
      : await db
          .select()
          .from(batches)
          .where(eq(batches.isPublished, true))
          .limit(3);

  // 5. Fetch Upcoming / Live Exams
  let liveExams: (typeof exams.$inferSelect)[] = [];
  if (userEnrolledBatchIds.length > 0) {
    const studentBatchExams = await db.query.batchExams.findMany({
      where: inArray(batchExams.batchId, userEnrolledBatchIds),
      with: {
        exam: true,
      },
      orderBy: [desc(batchExams.assignedAt)],
      limit: 3,
    });
    liveExams = studentBatchExams
      .map((be) => be.exam)
      .filter((e): e is typeof exams.$inferSelect => Boolean(e && e.isPublished));
  } else {
    const allAssignedBatchExams = await db
      .select({ examId: batchExams.examId })
      .from(batchExams);
    const assignedExamIds = allAssignedBatchExams.map((be) => be.examId);

    const basePracticeExams = await db
      .select()
      .from(exams)
      .where(and(eq(exams.isPublished, true), eq(exams.type, "practice")))
      .orderBy(desc(exams.createdAt))
      .limit(6);

    liveExams = basePracticeExams
      .filter((e) => !assignedExamIds.includes(e.id))
      .slice(0, 3);
  }

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const studentName = user?.name?.split(" ")[0] || "শিক্ষার্থী";

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-16 pt-2 sm:pt-4 md:py-6 gap-9 px-3 sm:px-6">
      {/* ─── Live / Active Exams Section ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                চলমান পরীক্ষাসমূহ
              </h2>
              <p className="text-xs text-muted-foreground">
                তোমার জন্য নির্ধারিত লাইভ এবং প্র্যাকটিস টেস্টসমূহ
              </p>
            </div>
          </div>
          <Link
            href="/exams"
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 group shrink-0"
          >
            <span>সকল পরীক্ষা</span>
            <ArrowRight2 className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {liveExams.length === 0 ? (
            <div className="col-span-full p-10 text-center rounded-3xl border border-dashed border-border/80 bg-card/50 text-muted-foreground text-xs sm:text-sm">
              বর্তমানে কোনো প্রকাশিত পরীক্ষা নেই। নতুন পরীক্ষা খুব শীঘ্রই যুক্ত হবে।
            </div>
          ) : (
            liveExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))
          )}
        </div>
      </section>

      {/* ─── Courses Section ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {userEnrolledCourses.length > 0
                  ? "আমার কোর্সসমূহ"
                  : "জনপ্রিয় ও প্রস্তাবিত কোর্স"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {userEnrolledCourses.length > 0
                  ? "চলমান কোর্সের ক্লাসে অংশগ্রহণ ও রুটিন দেখুন"
                  : "তোমার পছন্দের ব্যাচে যুক্ত হয়ে সম্পূর্ণ প্রস্তুতি শুরু করো"}
              </p>
            </div>
          </div>
          <Link
            href={
              userEnrolledCourses.length > 0
                ? "/my-courses"
                : "/#courses-section"
            }
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 group shrink-0"
          >
            <span>{userEnrolledCourses.length > 0 ? "সকল কোর্স" : "কোর্স ভিউ"}</span>
            <ArrowRight2 className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featuredCourses.map((batch) => {
            const isEnrolled = userEnrolledCourses.some((c) => c.id === batch.id);
            return (
              <CourseCard
                key={batch.id}
                course={batch as any}
                isEnrolled={isEnrolled}
                enrollmentHref={`/my-courses/${batch.id}`}
              />
            );
          })}
        </div>
      </section>

      {/* ─── Question Banks Quick Selector ────────────────────────────────────── */}
      {displayContainers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TaskSquare className="size-4" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  প্রশ্নব্যাংক সংকলন
                </h2>
                <p className="text-xs text-muted-foreground">
                  অধ্যায় ও টপিকভিত্তিক প্রশ্ন সরাসরি সমাধান ও প্র্যাকটিস করুন
                </p>
              </div>
            </div>
            <Link
              href="/qb"
              className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 group shrink-0"
            >
              <span>সকল প্রশ্নব্যাংক</span>
              <ArrowRight2 className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
            {displayContainers.map((qb) => (
              <Link href={`/qb/${qb.slug}`} key={qb.id} className="group">
                <Card className="rounded-3xl p-5 sm:p-6 border border-border/80 bg-card hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[130px] gap-3 cursor-pointer group-hover:-translate-y-1">
                  <div className="size-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform bg-primary/10 text-primary border border-primary/15 shadow-2xs">
                    <TaskSquare className="size-6" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {qb.title}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

