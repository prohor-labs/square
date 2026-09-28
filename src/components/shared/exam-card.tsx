import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight2,
  Calendar,
  Clock,
  DocumentDownload,
  Information,
  Star,
  TaskSquare,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBanglaDateTime } from "@/lib/date";

export type ExamCardProps = {
  readonly exam: {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly description?: string | null;
    readonly durationMinutes: number;
    readonly totalMarks: number;
    readonly negativeMarking?: number | string | null;
    readonly type?: "practice" | "chapter_test" | "weekly" | "model_test" | "live_contest" | string;
    readonly standard?: "HSC" | "Varsity" | "Engineering" | "Medical" | string;
    readonly isPublished?: boolean | null;
    readonly image?: string | null;
    readonly rating?: string;
  };
  readonly startsAt?: Date | string | null;
  readonly endsAt?: Date | string | null;
  readonly isBatchExam?: boolean;
  readonly basePath?: string;
};

export function ExamCard({
  exam,
  startsAt,
  endsAt,
  isBatchExam = false,
  basePath = "/exams",
}: ExamCardProps) {
  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const getExamTypeBadge = (type?: string) => {
    switch (type) {
      case "practice":
        return "প্র্যাকটিস টেস্ট";
      case "model_test":
        return "মডেল টেস্ট";
      case "chapter_test":
        return "অধ্যায়ভিত্তিক পরীক্ষা";
      case "weekly":
        return "সাপ্তাহিক টেস্ট";
      case "live_contest":
        return "লাইভ কনটেস্ট";
      default:
        return "অনলাইন পরীক্ষা";
    }
  };

  const getStandardBadge = (std?: string) => {
    switch (std) {
      case "Engineering":
        return "ইঞ্জিনিয়ারিং";
      case "Varsity":
        return "ভার্সিটি ক";
      case "Medical":
        return "মেডিকেল";
      case "HSC":
      default:
        return "HSC বোর্ড";
    }
  };

  const isLive = isBatchExam && startsAt && endsAt;
  const examImage = exam.image || "/images/image.png";

  return (
    <Card className="group relative bg-card/95 hover:bg-card border border-border/70 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-0">
      {/* ─── Card Header with Plain Background & Exam ID ──────────────────── */}
      <div className="relative aspect-[16/7.5] w-full overflow-hidden bg-gradient-to-br from-muted/80 via-muted/40 to-background border-b border-border/60 flex items-center justify-center p-6">
        {/* Subtle decorative grid/glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#8882_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Center: Exam ID Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/70 mb-1">
            EXAM ID
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-foreground group-hover:text-primary transition-colors">
            #{exam.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* ─── Card Content Body ───────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-3.5">
          {/* Exam Title */}
          <Link href={`${basePath}/${exam.slug}`}>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {exam.title}
            </h3>
          </Link>

          {/* Exam Schedule (startsAt / endsAt) */}
          {(startsAt || endsAt) ? (
            <div className="text-xs bg-muted/50 p-3 rounded-2xl text-muted-foreground space-y-1.5 border border-border/50 font-medium">
              {startsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    <span>শুরু:</span>
                  </span>
                  <span className="font-semibold text-foreground/90">
                    {formatBanglaDateTime(startsAt)}
                  </span>
                </div>
              )}
              {endsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-rose-500 shrink-0" />
                    <span>শেষ:</span>
                  </span>
                  <span className="font-semibold text-foreground/90">
                    {formatBanglaDateTime(endsAt)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TickCircle className="size-3.5 text-emerald-500 shrink-0" />
                <span>তাৎক্ষণিক ফলাফল ও বিস্তারিত এনালাইসিস</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TickCircle className="size-3.5 text-emerald-500 shrink-0" />
                <span>নেগেটিভ মার্কিং: {toBanglaDigits(exam.negativeMarking ?? "0.25")}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom Action Section (Exam Taking Button & Leaderboard) ───── */}
        <div className="space-y-2.5 pt-2 border-t border-border/50">
          <Button
            render={<Link href={`${basePath}/${exam.slug}`} />}
            className="w-full bg-primary text-primary-foreground py-2.5 h-auto rounded-xl font-bold text-sm hover:bg-primary/90 transition-all text-center shadow-xs hover:shadow-md cursor-pointer group/btn flex items-center justify-center gap-1.5"
          >
            <span>পরীক্ষায় অংশ নিন</span>
            <ArrowRight2 className="size-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Button>

          <Link
            href={`${basePath}/${exam.slug}/leaderboard`}
            className="group/lead w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
          >
            <span className="size-5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover/lead:scale-110 group-hover/lead:bg-amber-500 group-hover/lead:text-white transition-all duration-200 shrink-0">
              <Star className="size-3.5" />
            </span>
            <span>লিডারবোর্ড</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
