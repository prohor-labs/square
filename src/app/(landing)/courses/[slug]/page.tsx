import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CheckoutModal } from "@/components/checkout-modal";
import {
  ArrowLeft2,
  FileDown,
  Flame,
  Send,
  Star,
  User,
} from "@/components/icons";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  checkEnrollmentStatus,
  getCourseWithDetailsBySlug,
} from "@/lib/actions/course";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
    description: courseWithDetails.description,
    hscBatch: courseWithDetails.hscBatch,
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
    features:
      courseWithDetails.features ||
      courseWithDetails.details?.features ||
      [],
    instructors:
      courseWithDetails.instructors ||
      courseWithDetails.details?.instructors ||
      courseWithDetails.details?.mentorIds ||
      [],
    modules: Array.isArray(courseWithDetails.modules)
      ? courseWithDetails.modules
      : Array.isArray(courseWithDetails.details?.modules)
        ? courseWithDetails.details.modules
        : Array.isArray(courseWithDetails.details?.curriculum)
          ? courseWithDetails.details.curriculum
          : [],
    faqs:
      courseWithDetails.faqs ||
      courseWithDetails.details?.faqs ||
      [],
  };

  let enrollmentStatus = "none";
  if (session?.user?.id && course.id) {
    const statusResult = await checkEnrollmentStatus(
      session.user.id,
      course.id,
    );
    enrollmentStatus = statusResult?.status || "none";
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-6 w-full flex flex-col gap-6">
        {/* Back Link */}
        <div>
          <Link
            href="/#courses-section"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="p-1.5 rounded-xl border border-border/80 group-hover:border-foreground transition-all bg-card shadow-2xs">
              <ArrowLeft2 className="size-3.5" />
            </div>
            <span>সকল কোর্সে ফিরে যান</span>
          </Link>
        </div>

        {/* HERO COVER BANNER */}
        <section className="w-full relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 shadow-sm bg-muted aspect-16/7 md:aspect-21/9 max-h-[380px]">
          <Image
            src={course.image || "/images/image.png"}
            alt={`${course.name} - কোর্স কভার ছবি`}
            fill
            priority
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold bg-primary text-primary-foreground px-3.5 py-1 rounded-full shadow-md">
              {course.badge}
            </span>
            <span className="text-xs font-bold bg-black/60 text-white backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
              <Flame className="size-3.5 text-primary" /> লাইভ ব্যাচ ও এক্সাম
            </span>
          </div>
        </section>

        {/* MAIN TWO-COLUMN CONTENT & SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT CONTENT (Col Span 8) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Header / Intro Card */}
            <div className="bg-card rounded-2xl md:rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs space-y-4">
              <div className="border-l-4 border-primary pl-3.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                  {course.name}
                </h1>
                {course.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">
                    {course.subtitle}
                  </p>
                )}
              </div>

              {/* Tags & Social Proof Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center text-[11px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                    ● {course.duration}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-bold bg-muted text-foreground/80 px-3 py-1 rounded-full border border-border">
                    {course.hscBatch || "এডমিশন স্পেশাল"}
                  </span>
                </div>

                {/* Rating & Fake Social Proof Avatars */}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                  <div className="flex items-center text-amber-500 font-extrabold text-xs gap-1">
                    <Star className="size-3.5 fill-current" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden items-center ml-1">
                    <div className="inline-block size-5 rounded-full ring-2 ring-background bg-muted-foreground/40 text-[8px] font-bold text-background flex items-center justify-center">
                      A
                    </div>
                    <div className="inline-block size-5 rounded-full ring-2 ring-background bg-muted-foreground/70 text-[8px] font-bold text-background flex items-center justify-center">
                      R
                    </div>
                    <div className="inline-block size-5 rounded-full ring-2 ring-background bg-foreground text-[8px] font-bold text-background flex items-center justify-center">
                      S
                    </div>
                    <div className="inline-block size-5 rounded-full ring-2 ring-background bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center">
                      {course.ratingCount}
                    </div>
                  </div>
                </div>
              </div>

              {course.description && (
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-2">
                  {course.description}
                </p>
              )}
            </div>

            {/* ROADMAP / COURSE FEATURES */}
            {course.features.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    কোর্স ফিচারসমূহ :
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {course.features.map((feature: any, idx: number) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3.5 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs hover:border-primary/50 transition-all group"
                    >
                      <div className="size-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center shrink-0 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                          {feature}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          সম্পূর্ণ এডমিশন ও বোর্ড স্ট্যান্ডার্ড বাছাইকৃত প্রশ্ন ও প্র্যাকটিস
                          গাইডলাইন।
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
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    কোর্স মেন্টর
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.instructors.map(
                    (instructor: {
                      name: string;
                      role: string;
                      institution: string;
                    }) => (
                      <div
                        key={instructor.name}
                        className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs"
                      >
                        <div className="size-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                          <User className="size-7" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-foreground leading-tight">
                            {instructor.name}
                          </h3>
                          <p className="text-xs font-semibold text-primary mt-0.5">
                            {instructor.role}
                          </p>
                          <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                            {instructor.institution}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            {/* FAQS SECTION */}
            {course.faqs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
                  </h2>
                </div>

                <div className="bg-card rounded-2xl md:rounded-3xl p-5 sm:p-7 border border-border/80 shadow-xs">
                  <Accordion className="w-full">
                    {course.faqs.map((faq: any, idx: number) => (
                      <AccordionItem
                        key={faq.question}
                        value={`faq-${idx}`}
                        className="border-border/60 py-1"
                      >
                        <AccordionTrigger className="text-left font-bold text-foreground text-xs sm:text-sm hover:no-underline py-3 cursor-pointer">
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
            <div className="bg-card rounded-2xl md:rounded-3xl p-5 sm:p-7 border-2 border-border shadow-md space-y-6">
              <div className="text-center space-y-1 pb-4 border-b border-border/60">
                <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full mb-1">
                  ভর্তি চলছে
                </span>
                <h2 className="text-lg font-black text-foreground">
                  {course.name}
                </h2>
              </div>

              {/* Price Banner */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/70 text-center space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  এককালীন কোর্স ফি
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">
                    ৳{course.price}
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through font-bold">
                      ৳{course.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Routine Download Button */}
              {course.routinePdfUrl ? (
                <a
                  href={course.routinePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold py-2.5 px-4 rounded-xl transition-all text-xs border border-border"
                >
                  <FileDown className="size-4 text-primary" /> রুটিন ডাউনলোড করুন
                  (PDF)
                </a>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {enrollmentStatus === "active" ? (
                  <Button
                    render={<Link href={`/my-courses/${course.id}`} />}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 h-auto rounded-xl text-sm shadow-md"
                  >
                    ইতিমধ্যে যুক্ত আছো &rarr;
                  </Button>
                ) : enrollmentStatus === "pending" ? (
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-center font-extrabold py-3.5 rounded-xl text-sm shadow-xs">
                    পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন
                  </div>
                ) : !session?.user?.id ? (
                  <Button
                    render={<Link href={`/login?callbackUrl=/courses/${slug}`} />}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold py-4 h-auto rounded-xl text-sm shadow-md transition-all hover:scale-101 cursor-pointer"
                  >
                    এখনই ভর্তি হোন
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
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold py-4 h-auto rounded-xl text-sm shadow-md transition-all hover:scale-101 cursor-pointer">
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
                  className="w-full font-bold py-3 h-auto rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border-border text-xs"
                >
                  <Send
                    data-icon="inline-start"
                    className="size-3.5 text-sky-500"
                  />
                  <span>ভর্তি সংক্রান্ত সহায়তা (টেলিগ্রাম)</span>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
