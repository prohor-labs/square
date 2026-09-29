import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight2,
  Calendar,
  Information,
  Send,
  Teacher,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type CourseCardProps = {
  readonly course: {
    readonly id: string;
    readonly slug: string;
    readonly name?: string;
    readonly title?: string;
    readonly subtitle?: string | null;
    readonly description?: string | null;
    readonly hscBatch?: string;
    readonly price: number;
    readonly originalPrice?: number | null;
    readonly image: string;
    readonly badge?: string | null;
    readonly duration?: string;
    readonly rating?: string;
    readonly ratingCount?: string;
    readonly routinePdfUrl?: string;
    readonly telegramGroupUrl?: string;
    readonly features?: string[];
    readonly instructors?: Array<{
      readonly name: string;
      readonly role?: string;
      readonly institution?: string;
    }>;
  };
  readonly isEnrolled?: boolean;
  readonly enrollmentHref?: string;
};

export function CourseCard({
  course,
  isEnrolled = false,
  enrollmentHref,
}: CourseCardProps) {
  const displayTitle = course.name || course.title || "কোর্স";
  const discountPercent =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round(
          ((course.originalPrice - course.price) / course.originalPrice) * 100
        )
      : null;
  const hasDiscount = Boolean(discountPercent && discountPercent > 0);
  const topFeatures = (course.features || []).slice(0, 3);
  const leadInstructor = course.instructors?.[0];

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const destinationHref = isEnrolled
    ? enrollmentHref || `/my-courses/${course.id}`
    : `/courses/${course.slug}`;

  return (
    <Card className="group relative bg-card/95 hover:bg-card border border-border/70 hover:border-primary/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-0">
      {/* Card Media Header */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          alt={displayTitle}
          className="size-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          src={course.image || "/images/image.png"}
          width={600}
          height={338}
          unoptimized
        />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md backdrop-blur-md">
            {course.badge || course.hscBatch || "স্পেশাল ব্যাচ"}
          </span>

          {isEnrolled ? (
            <span className="text-[11px] font-extrabold bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
              <TickCircle className="size-3" /> এক্টিভ
            </span>
          ) : (
            hasDiscount && (
              <span className="text-[11px] font-extrabold bg-rose-500 text-white px-2.5 py-1 rounded-full shadow-md">
                {toBanglaDigits(discountPercent!)}% ছাড়
              </span>
            )
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-3.5">
          {/* Course Title */}
          <Link href={destinationHref}>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {displayTitle}
            </h3>
          </Link>

          {/* Instructor Tag */}
          {leadInstructor && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Teacher className="size-3.5" />
              </div>
              <span className="font-semibold text-foreground/80 truncate">
                {leadInstructor.name}
                {leadInstructor.institution && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    • {leadInstructor.institution}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Feature Highlights Pills */}
          {topFeatures.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {topFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <TickCircle className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Section */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          {/* Price Strip */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {course.price === 0 ? "ফ্রী" : `৳${toBanglaDigits(course.price)}`}
              </span>
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="text-sm font-semibold text-muted-foreground line-through decoration-muted-foreground/60">
                  ৳{toBanglaDigits(course.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-0.5 rounded-md">
              এককালীন ফি
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              render={<Link href={destinationHref} />}
              className="w-full bg-primary text-primary-foreground py-2.5 h-auto rounded-xl font-bold text-sm hover:bg-primary/90 transition-all text-center shadow-xs hover:shadow-md cursor-pointer group/btn flex items-center justify-center gap-1.5"
            >
              <span>{isEnrolled ? "কোর্সে প্রবেশ করুন" : "এনরোল করুন"}</span>
              <ArrowRight2 className="size-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Button>

            {/* Secondary Actions (Routine & Details & Telegram) */}
            <div className={`grid gap-2 pt-1 ${isEnrolled && course.telegramGroupUrl ? "grid-cols-3" : "grid-cols-2"}`}>
              {course.routinePdfUrl ? (
                <Link
                  href={course.routinePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/routine inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
                >
                  <span className="size-4.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover/routine:scale-110 group-hover/routine:bg-indigo-500 group-hover/routine:text-white transition-all duration-200 shrink-0">
                    <Calendar className="size-3" />
                  </span>
                  <span>রুটিন</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-border/40 bg-muted/20 text-muted-foreground/50 font-medium text-xs cursor-not-allowed"
                >
                  <Calendar className="size-3" />
                  <span>রুটিন</span>
                </button>
              )}

              {isEnrolled && course.telegramGroupUrl && (
                <a
                  href={course.telegramGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/tg inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-blue-500/40 hover:text-blue-500 text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
                >
                  <span className="size-4.5 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover/tg:scale-110 group-hover/tg:bg-blue-500 group-hover/tg:text-white transition-all duration-200 shrink-0">
                    <Send className="size-3" />
                  </span>
                  <span>টেলিগ্রাম</span>
                </a>
              )}

              <Link
                href={`/courses/${course.slug}`}
                className="group/details inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/90 hover:border-primary/40 hover:text-primary text-foreground/80 font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-2xs"
              >
                <span className="size-4.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover/details:scale-110 group-hover/details:bg-primary group-hover/details:text-primary-foreground transition-all duration-200 shrink-0">
                  <Information className="size-3" />
                </span>
                <span>বিস্তারিত</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
