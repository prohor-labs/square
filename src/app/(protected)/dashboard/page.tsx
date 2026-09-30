import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight2,
  BookOpen,
  Lock,
  TaskSquare,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { db } from "@/db";
import {
  batchEnrollments,
  batchExams,
  batchMembers,
  batches,
  exams,
} from "@/db/schema";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";


export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const userId = user?.id;

  // 1. Fetch Question Banks with real access status (only show accessible ones)
  const userContainers = await getUserQbContainers(userId);
  const displayContainers = userContainers
    .filter((c) => c.hasAccess || c.isAdmin)
    .slice(0, 4);

  // 2. Fetch User's Enrolled Batches (from both active enrollments & batch memberships)
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
            eq(batchEnrollments.status, "active"),
          ),
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
            eq(batchMembers.status, "active"),
          ),
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

  // 3. If user has no enrollments, fetch popular batches to show
  const featuredCourses =
    userEnrolledCourses.length > 0
      ? userEnrolledCourses.slice(0, 3)
      : await db
          .select()
          .from(batches)
          .where(eq(batches.isPublished, true))
          .limit(3);

  // 4. Fetch Upcoming / Live Exams (Only for user's enrolled batches; if not enrolled in any course, do NOT show course batch exams)
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
    // If student is NOT enrolled in any course, only show standalone public practice exams that are NOT assigned to any batch
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
      (digit) => bnDigits[Number(digit)] || digit,
    );
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-16 pt-1 sm:pt-4 md:py-6 gap-6 sm:gap-8 px-2 sm:px-4 md:px-6">

      {/* ─── Live / Active Exams Section ───────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold text-foreground">
              চলমান পরীক্ষাসমূহ
            </h2>
          </div>
          <Link
            href="/exams"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            সকল পরীক্ষা <ArrowRight2 className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveExams.length === 0 ? (
            <div className="col-span-full p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground text-xs">
              বর্তমানে কোনো প্রকাশিত পরীক্ষা নেই
            </div>
          ) : (
            liveExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {exam.type === "practice" ? "প্র্যাকটিস" : "মডেল টেস্ট"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      সময়: {toBanglaDigits(exam.durationMinutes)} মিনিট
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    মোট মার্কস: {toBanglaDigits(exam.totalMarks)} • নেগেটিভ:{" "}
                    {toBanglaDigits(exam.negativeMarking)}
                  </p>
                </div>

                <Button
                  render={<Link href={`/exams/${exam.slug}`} />}
                  size="sm"
                  className="rounded-xl font-bold text-xs h-9 px-4 w-full shadow-xs"
                >
                  অংশ নিন
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Courses Section ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              {userEnrolledCourses.length > 0
                ? "আমার কোর্সসমূহ"
                : "জনপ্রিয় ও প্রস্তাবিত কোর্স"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {userEnrolledCourses.length > 0
                ? "চলমান কোর্সের ক্লাসে অংশগ্রহণ করুন"
                : "আপনার একাডেমিক ও এডমিশন প্রস্তুতির কোর্সসমূহ"}
            </p>
          </div>
          <Link
            href={userEnrolledCourses.length > 0 ? "/my-courses" : "/#courses-section"}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            সকল কোর্স <ArrowRight2 className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredCourses.map((batch) => (
            <Card
              key={batch.id}
              className="bg-card rounded-[22px] overflow-hidden border border-border/70 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-0 group"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image
                  alt={batch.name}
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={batch.image || "/images/image.png"}
                  width={500}
                  height={280}
                  unoptimized
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-1">
                    ব্যাচ: {batch.hscBatch}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground line-clamp-2 leading-snug">
                    {batch.name}
                  </h3>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-base font-black text-foreground">
                    ৳{toBanglaDigits(batch.price)}
                  </span>
                  <Button
                    render={
                      <Link
                        href={
                          userEnrolledCourses.some((c) => c.id === batch.id)
                            ? `/my-courses/${batch.id}`
                            : `/courses/${batch.slug}`
                        }
                      />
                    }
                    size="sm"
                    className="rounded-xl font-bold text-xs h-8.5 px-4 shadow-xs"
                  >
                    {userEnrolledCourses.some((c) => c.id === batch.id)
                      ? "কোর্সে প্রবেশ"
                      : "বিস্তারিত দেখুন"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Question Banks Quick Selector ────────────────────────────────────── */}
      {displayContainers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                প্রশ্নব্যাংক সংকলন
              </h2>
              <p className="text-xs text-muted-foreground">
                অধ্যায় ও টপিকভিত্তিক প্রশ্ন সরাসরি সমাধান করুন
              </p>
            </div>
            <Link
              href="/qb"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              সকল প্রশ্নব্যাংক <ArrowRight2 className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {displayContainers.map((qb) => (
              <Link href={`/qb/${qb.slug}`} key={qb.id} className="group">
                <div className="rounded-2xl p-4 md:p-5 border transition-all text-center flex flex-col items-center justify-center min-h-[105px] gap-1.5 border-border/70 bg-card hover:border-primary/50 shadow-2xs hover:shadow-md">
                  <div className="size-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform bg-primary/10 text-primary">
                    <TaskSquare className="size-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {qb.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
