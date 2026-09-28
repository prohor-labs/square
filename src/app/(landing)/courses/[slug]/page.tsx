import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CheckoutModal } from "@/components/checkout-modal";
import {
  ArrowLeft2,
  BookOpen,
  Calendar,
  CalendarTick,
  Clock,
  DocumentDownload,
  FileDown,
  FileText,
  Flame,
  Information,
  SecurityCard,
  Send,
  ShieldCheck,
  Star,
  TaskSquare,
  Teacher,
  TickCircle,
  Trophy,
  User,
} from "@/components/icons";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  checkEnrollmentStatus,
  getCourseWithDetailsBySlug,
} from "@/lib/actions/course";
import { auth } from "@/lib/auth";

interface CourseDetailPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps): Promise<ReactElement> {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const courseWithDetails = (await getCourseWithDetailsBySlug(slug)) as any;

  if (!courseWithDetails) {
    notFound();
  }

  const course = {
    id: courseWithDetails.id,
    slug: courseWithDetails.slug,
    name: courseWithDetails.name || courseWithDetails.title || "",
    title: courseWithDetails.name || courseWithDetails.title || "",
    subtitle: courseWithDetails.subtitle || "",
    description: courseWithDetails.description || "",
    hscBatch: courseWithDetails.hscBatch || "HSC Batch",
    price: courseWithDetails.price,
    originalPrice: courseWithDetails.originalPrice,
    image: courseWithDetails.image,
    badge: courseWithDetails.badge || "স্পেশাল ব্যাচ",
    duration:
      courseWithDetails.duration ||
      courseWithDetails.details?.duration ||
      "১ বছর কমপ্লিট এক্সেস",
    rating:
      courseWithDetails.rating ||
      courseWithDetails.details?.rating ||
      "5.0",
    ratingCount:
      courseWithDetails.ratingCount ||
      courseWithDetails.details?.ratingCount ||
      "50+",
    routinePdfUrl:
      courseWithDetails.routinePdfUrl ||
      courseWithDetails.details?.routinePdfUrl ||
      courseWithDetails.details?.routineUrl,
    telegramGroupUrl:
      courseWithDetails.telegramGroupUrl ||
      courseWithDetails.details?.telegramGroupUrl ||
      "https://t.me/shu_yaib",
    features: (courseWithDetails.features ||
      courseWithDetails.details?.features ||
      []) as string[],
    instructors: (courseWithDetails.instructors ||
      courseWithDetails.details?.instructors ||
      courseWithDetails.details?.mentorIds ||
      []) as Array<{
      name: string;
      role?: string;
      institution?: string;
    }>,
    faqs: (courseWithDetails.faqs ||
      courseWithDetails.details?.faqs ||
      []) as Array<{
      question: string;
      answer: string;
    }>,
  };

  const discountPercent =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round(
          ((course.originalPrice - course.price) / course.originalPrice) * 100
        )
      : null;

  let enrollmentStatus = "none";
  if (session?.user?.id && course.id) {
    const statusResult = await checkEnrollmentStatus(
      session.user.id,
      course.id
    );
    enrollmentStatus = statusResult?.status || "none";
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/#courses-section"
            className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="size-8 rounded-xl border border-border/80 group-hover:border-primary/60 group-hover:text-primary transition-all bg-card flex items-center justify-center shadow-2xs">
              <ArrowLeft2 className="size-4" />
            </div>
            <span>সকল কোর্সে ফিরে যান</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-muted/60 border border-border/60 px-3 py-1 rounded-full text-muted-foreground">
              ক্যাটাগরি: <strong className="text-foreground">{course.hscBatch}</strong>
            </span>
          </div>
        </div>

        {/* HERO COVER BANNER */}
        <section className="w-full relative overflow-hidden rounded-3xl border border-border/70 shadow-lg bg-card aspect-video max-w-4xl mx-auto">
          <Image
            src={course.image || "/images/image.png"}
            alt={`${course.name} - কোর্স কভার ছবি`}
            fill
            priority
            unoptimized
            className="object-contain md:object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Top Chips */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex flex-wrap items-center gap-2 pointer-events-none">
            <span className="text-xs font-black bg-primary text-primary-foreground px-3.5 py-1 rounded-full shadow-md backdrop-blur-md">
              {course.badge}
            </span>
            {discountPercent && discountPercent > 0 && (
              <span className="text-xs font-black bg-rose-500 text-white px-3 py-1 rounded-full shadow-md">
                {discountPercent}% স্পেশাল ছাড়
              </span>
            )}
          </div>

          {/* Bottom Banner Info */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
            <div className="space-y-1 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <Flame className="size-3.5 text-primary" /> লাইভ ব্যাচ ও এক্সাম
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-md leading-tight">
                {course.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                <Clock className="size-4 text-primary" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                <Star className="size-4 fill-current" />
                <span>{course.rating}</span>
                <span className="text-white/80 font-normal">({course.ratingCount} রিভিউ)</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN TWO-COLUMN CONTENT & SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT CONTENT (Col Span 8) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Overview / About Card */}
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs space-y-5">
              <div className="space-y-2 border-l-4 border-primary pl-4">
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  কোর্স পরিচিতি ও উদ্দেশ্য
                </h2>
                {course.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-primary">
                    {course.subtitle}
                  </p>
                )}
              </div>

              {course.description ? (
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {course.description}
                </p>
              ) : (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  এই কোর্সের মাধ্যমে সম্পূর্ণ পরীক্ষার সিলেবাস ভিত্তিক নিয়মিত প্র্যাকটিস, লাইভ এক্সাম ও মেন্টরদের পরামর্শের সুযোগ নিশ্চিত করা হয়েছে।
                </p>
              )}

              {/* Quick Specs Highlight Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">কোর্সের মেয়াদ</span>
                  <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary shrink-0" />
                    {course.duration}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">টার্গেট ব্যাচ</span>
                  <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Trophy className="size-4 text-amber-500 shrink-0" />
                    {course.hscBatch}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">মেন্টর সাপোর্ট</span>
                  <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Teacher className="size-4 text-indigo-500 shrink-0" />
                    BUET &amp; KUET মেন্টরস
                  </span>
                </div>
              </div>
            </div>

            {/* FEATURES & CURRICULUM SECTION */}
            {course.features.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <TaskSquare className="size-4" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-foreground">
                    কোর্স ফিচারসমূহ ও প্ল্যান
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.features.map((feature: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 bg-card p-5 rounded-2xl border border-border/80 shadow-2xs hover:border-primary/50 hover:shadow-sm transition-all group"
                    >
                      <div className="size-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center shrink-0 font-black text-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {feature}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          মানসম্মত প্রশ্নব্যাংক ও ডেডিকেটেড এক্সাম সিস্টেমে নিয়মিত অনুশীলন।
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MENTORS SECTION */}
            {course.instructors.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <Teacher className="size-4" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-foreground">
                    কোর্স মেন্টর ও ইন্সট্রাক্টর
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.instructors.map((instructor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-2xs hover:border-indigo-500/40 transition-all group"
                    >
                      <div className="size-14 rounded-2xl bg-foreground/10 text-foreground dark:bg-foreground/20 flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
                        <User className="size-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-foreground leading-tight">
                          {instructor.name}
                        </h3>
                        <p className="text-xs font-bold text-primary mt-0.5">
                          {instructor.role || "Instructor"}
                        </p>
                        {instructor.institution && (
                          <span className="text-xs font-semibold text-muted-foreground block mt-0.5">
                            {instructor.institution}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQS SECTION */}
            {course.faqs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <Information className="size-4" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-foreground">
                    সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
                  </h2>
                </div>

                <div className="bg-card rounded-3xl p-5 sm:p-7 border border-border/80 shadow-xs">
                  <Accordion className="w-full">
                    {course.faqs.map((faq, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`faq-${idx}`}
                        className="border-border/60 py-1"
                      >
                        <AccordionTrigger className="text-left font-bold text-foreground text-sm hover:no-underline py-3 cursor-pointer">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed pt-1 pb-3">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </section>
            )}
          </div>

          {/* ================= RIGHT SIDEBAR (Col Span 4) ================= */}
          <aside className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-card rounded-3xl p-6 sm:p-7 border-2 border-border/80 shadow-lg space-y-6">
              {/* Header Box */}
              <div className="text-center space-y-1.5 pb-4 border-b border-border/60">
                <span className="inline-block text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full mb-1">
                  ভর্তি চলছে • {course.hscBatch}
                </span>
                <h2 className="text-lg font-black text-foreground leading-snug">
                  {course.name}
                </h2>
              </div>

              {/* Price Banner */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/70 text-center space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  এককালীন কোর্স ফি
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">
                    {course.price === 0 ? "ফ্রী" : `৳${course.price}`}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-base text-muted-foreground line-through font-bold">
                      ৳{course.originalPrice}
                    </span>
                  )}
                </div>
                {discountPercent && discountPercent > 0 && (
                  <span className="text-[11px] font-bold text-rose-500 block pt-0.5">
                    মোট {discountPercent}% ছাড় চলমান!
                  </span>
                )}
              </div>

              {/* Routine Download Button */}
              {course.routinePdfUrl ? (
                <a
                  href={course.routinePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-muted/80 hover:bg-muted text-foreground font-bold py-3 px-4 rounded-xl transition-all text-xs border border-border/80 shadow-2xs group"
                >
                  <FileDown className="size-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>রুটিন ডাউনলোড করুন (PDF)</span>
                </a>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {enrollmentStatus === "active" ? (
                  <Button
                    render={<Link href={`/my-courses/${course.id}`} />}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 h-auto rounded-xl text-sm shadow-md transition-all"
                  >
                    <span>ইতিমধ্যে যুক্ত আছো &rarr;</span>
                  </Button>
                ) : enrollmentStatus === "pending" ? (
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-center font-black py-3.5 rounded-xl text-sm shadow-xs">
                    পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন
                  </div>
                ) : !session?.user?.id ? (
                  <Button
                    render={
                      <Link href={`/login?callbackUrl=/courses/${slug}`} />
                    }
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black py-4 h-auto rounded-xl text-sm shadow-md transition-all hover:scale-101 cursor-pointer"
                  >
                    <span>এখনই ভর্তি হোন</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {enrollmentStatus === "rejected" && (
                      <div className="w-full bg-destructive/10 border border-destructive/30 text-destructive text-center font-bold py-2.5 px-3 rounded-xl text-xs shadow-xs leading-snug">
                        পূর্বের পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে। সঠিক তথ্য দিয়ে পুনরায়
                        চেষ্টা করুন।
                      </div>
                    )}
                    <CheckoutModal
                      batchId={course.id}
                      batchTitle={course.name}
                      price={course.price}
                      userId={session.user.id}
                    >
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black py-4 h-auto rounded-xl text-sm shadow-md transition-all hover:scale-101 cursor-pointer">
                        {enrollmentStatus === "rejected"
                          ? "পুনরায় ভর্তি হোন"
                          : "এখনই ভর্তি হোন"}
                      </Button>
                    </CheckoutModal>
                  </div>
                )}

                <Button
                  render={
                    <a
                      href={course.telegramGroupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    />
                  }
                  variant="outline"
                  className="w-full font-bold py-3 h-auto rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border-border/80 text-xs"
                >
                  <Send
                    data-icon="inline-start"
                    className="size-3.5 text-sky-500"
                  />
                  <span>ভর্তি সংক্রান্ত সহায়তা (টেলিগ্রাম)</span>
                </Button>
              </div>

              {/* Trust & Guarantee Box */}
              <div className="pt-3 border-t border-border/50 flex flex-col gap-2 text-xs text-muted-foreground font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                  <span>১০০% নিরাপদ ও ইনস্ট্যান্ট এনরোলমেন্ট</span>
                </div>
                <div className="flex items-center gap-2">
                  <SecurityCard className="size-4 text-blue-500 shrink-0" />
                  <span>বিকাশ ও নগদে পেমেন্ট সাপোর্ট</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

