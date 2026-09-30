"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft2,
  Clock,
  Danger,
  Information,
  ShieldCheck,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStartExam } from "@/hooks/use-exam";
import type { ExamDetail } from "@/types";

interface ExamAccess {
  allowed: boolean;
  error?: string;
  batchExamId?: string | null;
  previousAttemptsCount?: number;
  latestSubmissionId?: string | null;
  latestSubmissionStatus?: string | null;
}

interface ExamLobbyViewProps {
  exam: ExamDetail;
  access: ExamAccess;
  userId: string;
}

export function ExamLobbyView({ exam, access, userId }: ExamLobbyViewProps) {
  const router = useRouter();
  const startExamMutation = useStartExam();

  const handleStart = async () => {
    if (!access.allowed) return;

    const res = await startExamMutation.mutateAsync({
      examId: exam.id,
      userId: userId,
      batchExamId: access.batchExamId || undefined,
    });

    if (res.success && res.submission?.id) {
      router.push(`/exams/${exam.slug}/take?sid=${res.submission.id}`);
    } else {
      alert(`পরীক্ষা শুরু করতে সমস্যা হয়েছে: ${res.error}`);
    }
  };

  const examTypeLabel =
    exam.type === "chapter_test"
      ? "অধ্যায়ভিত্তিক পরীক্ষা"
      : exam.type === "model_test"
        ? "মডেল টেস্ট"
        : exam.type === "weekly"
          ? "উইকলি টেস্ট"
          : "প্র্যাকটিস টেস্ট";

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16 pt-2 md:py-8 gap-8 px-4 sm:px-6">
      {/* Top Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg"
        >
          <ArrowLeft2 className="size-4" />
          <span>পরীক্ষাসমূহে ফিরে যান</span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {examTypeLabel}
        </span>
      </div>

      {/* Main Header */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {exam.title}
        </h1>
        {exam.description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {exam.description}
          </p>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              মোট মার্কস
            </span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TaskSquare className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {exam.totalMarks}
            </div>
            <span className="text-[11px] text-muted-foreground">নম্বর</span>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              সময়সীমা
            </span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {exam.durationMinutes}
            </div>
            <span className="text-[11px] text-muted-foreground">মিনিট</span>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              নেগেটিভ মার্ক
            </span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Information className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {exam.negativeMarking}
            </div>
            <span className="text-[11px] text-muted-foreground">
              প্রতি ভুল উত্তরে
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              পাস মার্ক
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TickCircle className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {Math.ceil(exam.totalMarks * 0.4)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              নম্বর (৪০%)
            </span>
          </div>
        </div>
      </div>

      {/* Guidelines and Rules Section */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-7 space-y-4 shadow-2xs">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground pb-3 border-b">
          <ShieldCheck className="size-5 text-primary" />
          পরীক্ষা সংক্রান্ত নিয়মাবলী ও নির্দেশনা
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>পরীক্ষা চলাকালীন কোনোভাবেই ট্যাব সুইচ বা রিফ্রেশ করা যাবে না।</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>সময় শেষ হওয়ার সাথে সাথে আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে জমা হবে।</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <span>
              প্রতিটি ভুল উত্তরের জন্য <strong>{exam.negativeMarking}</strong> নম্বর
              কাটা যাবে।
            </span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span>পরীক্ষা সম্পন্ন করার পর সাথে সাথে ফলাফল ও সমাধান দেখতে পাবেন।</span>
          </div>
        </div>
      </div>

      {/* Access Status & Start Exam CTA */}
      <div className="flex flex-col items-center pt-2">
        {!access.allowed ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-2xl text-center space-y-1 w-full max-w-lg">
            <div className="font-bold text-sm sm:text-base flex items-center justify-center gap-2">
              <Danger className="size-5 shrink-0" />
              দুঃখিত, আপনি এই পরীক্ষায় অংশগ্রহণ করার জন্য অনুমোদিত নন।
            </div>
            {access.error && (
              <p className="text-xs opacity-80 pt-1">{access.error}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
            {access.previousAttemptsCount && access.previousAttemptsCount > 0 && access.latestSubmissionId ? (
              <>
                <Link href={`/exams/${exam.slug}/result?sid=${access.latestSubmissionId}`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px] px-6 h-12 rounded-xl text-sm sm:text-base font-bold shadow-xs cursor-pointer"
                  >
                    আগের ফলাফল দেখুন 📊
                  </Button>
                </Link>

                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[220px] px-8 h-12 rounded-xl text-sm sm:text-base font-bold shadow-sm transition-all cursor-pointer bg-primary text-primary-foreground"
                  onClick={handleStart}
                  disabled={startExamMutation.isPending}
                >
                  {startExamMutation.isPending ? (
                    <>
                      <Spinner className="size-5 mr-2" /> পরীক্ষা লোড হচ্ছে...
                    </>
                  ) : (
                    "পুনরায় প্র্যাকটিস পরীক্ষা দিন 🔁"
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[240px] px-8 h-12 rounded-xl text-base font-bold shadow-sm transition-all cursor-pointer"
                onClick={handleStart}
                disabled={startExamMutation.isPending}
              >
                {startExamMutation.isPending ? (
                  <>
                    <Spinner className="size-5 mr-2" /> পরীক্ষা লোড হচ্ছে...
                  </>
                ) : (
                  "পরীক্ষা শুরু করুন →"
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
