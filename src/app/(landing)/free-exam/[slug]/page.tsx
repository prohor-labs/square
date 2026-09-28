import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import {
  ArrowLeft2,
  Award,
  BookOpen,
  Clock,
  Danger,
  Flash,
  Information,
  SecurityCard,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicFreeExamDetailsAction } from "@/lib/actions/free-exam";
import { FreeExamStartForm } from "@/components/free-exam/free-exam-start-form";


interface FreeExamOverviewPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export default async function FreeExamOverviewPage({
  params,
}: FreeExamOverviewPageProps): Promise<ReactElement> {
  const { slug } = await params;
  const res = await getPublicFreeExamDetailsAction(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const exam = res.data;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-6 sm:py-10 w-full flex flex-col gap-6">
        {/* Back Link */}
        <div>
          <Link
            href="/free-exam"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-1.5 rounded-xl border border-border/80 group-hover:border-foreground transition-all bg-card shadow-2xs">
              <ArrowLeft2 className="size-3.5" />
            </div>
            <span>সকল ফ্রি এক্সামে ফিরে যান</span>
          </Link>
        </div>

        {/* Main Exam Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Exam Details & Rules (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                  ● ফ্রি অনলাইন এক্সাম
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight leading-snug">
                  {exam.title}
                </h1>
                {exam.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    {exam.description}
                  </p>
                )}
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block flex items-center justify-center gap-1">
                    <Clock className="size-3 text-primary" /> সময়
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {exam.durationMinutes} মিনিট
                  </span>
                </div>
                <div className="space-y-1 border-x border-border/60">
                  <span className="text-[11px] font-medium text-muted-foreground block flex items-center justify-center gap-1">
                    <TaskSquare className="size-3 text-primary" /> পূর্ণমান
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {exam.totalMarks} মার্কস
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block flex items-center justify-center gap-1">
                    <Danger className="size-3 text-destructive" /> নেগেটিভ
                  </span>
                  <span className="text-sm font-bold text-destructive">
                    -{exam.negativeMarking}
                  </span>
                </div>
              </div>

              {/* Exam Instructions */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <h3 className="font-extrabold text-sm flex items-center gap-2 text-foreground">
                  <Information className="size-4 text-primary" />
                  <span>পরীক্ষার নিয়মাবলী :</span>
                </h3>
                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <TickCircle className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>কোনো লগইন বা একাউন্টের প্রয়োজন নেই। শুধু নাম লিখে শুরু করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TickCircle className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>টাইমার শেষ হওয়ার সাথে সাথে পরীক্ষাটি স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TickCircle className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>ভুল উত্তরের জন্য প্রতিটিতে {exam.negativeMarking} মার্ক কাটা যাবে।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TickCircle className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>পরীক্ষা শেষে তাৎক্ষণিক পূর্ণাঙ্গ সমাধান ও লাইভ মেধা তালিকা দেখতে পাবেন।</span>
                  </li>
                </ul>
              </div>

              {/* View Leaderboard Link */}
              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-2xl font-bold text-xs h-10 border-border/80 gap-2 cursor-pointer"
                >
                  <Link href={`/free-exam/${exam.slug}/leaderboard`}>
                    <Award className="size-4 text-amber-500" />
                    <span>এই পরীক্ষার লাইভ লিডারবোর্ড দেখুন</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Name Input & Start Form (5 cols) */}
          <div className="md:col-span-5 sticky top-24">
            <FreeExamStartForm exam={exam} />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
