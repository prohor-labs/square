import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CourseFeatureIcon } from "@/components/course-feature-icon";
import { CourseStickyBar } from "@/components/courses/CourseStickyBar";
import { EnrollAction } from "@/components/courses/EnrollAction";
import {
  ArrowLeft2,
  CalendarTick,
  Flame,
  Star,
  User,
} from "@/components/icons";
import { LandingHeader } from "@/components/landing-nav";
import { RoutineGallery } from "@/components/student/RoutineGallery";
import {
  checkEnrollmentStatus,
  getCourseWithDetailsBySlug,
} from "@/lib/actions/course";
import { getBatchRoutineImages } from "@/lib/actions/routine-images";
import { auth } from "@/lib/auth";
import { toCourseFeatures } from "@/lib/course-features";
import { mentorInitial, toCourseMentors } from "@/lib/course-mentors";

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
      courseWithDetails.rating || courseWithDetails.details?.rating || "5.0",
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
    features: toCourseFeatures(
      courseWithDetails.features || courseWithDetails.details?.features,
    ),
    instructors: toCourseMentors(
      courseWithDetails.instructors ||
        courseWithDetails.details?.instructors ||
        courseWithDetails.details?.mentorIds,
    ),
    modules: Array.isArray(courseWithDetails.modules)
      ? courseWithDetails.modules
      : Array.isArray(courseWithDetails.details?.modules)
        ? courseWithDetails.details.modules
        : Array.isArray(courseWithDetails.details?.curriculum)
          ? courseWithDetails.details.curriculum
          : [],
  };

  let enrollmentStatus = "none";
  if (session?.user?.id && course.id) {
    const statusResult = await checkEnrollmentStatus(
      session.user.id,
      course.id,
    );
    enrollmentStatus = statusResult?.status || "none";
  }

  const routineImages = course.id ? await getBatchRoutineImages(course.id) : [];

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
                    {course.hscBatch || "Admission"}
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

            {/* COURSE FEATURES — no numbers: these are parallel benefits, not
                steps. Each icon is the one the admin chose for that feature. */}
            {course.features.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    কোর্স ফিচারসমূহ
                  </h2>
                </div>

                {/* One box for the whole list. Features are short lines of
                    benefit, not separate cards — boxing each one gave every
                    line its own border and shadow, which made four short
                    sentences look like four different sections. */}
                <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs md:rounded-3xl">
                  {course.features.map((feature) => (
                    <div
                      key={feature.label}
                      className="flex items-center gap-3.5 p-4 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CourseFeatureIcon
                          name={feature.icon}
                          className="size-4"
                        />
                      </span>
                      <p className="text-xs leading-relaxed font-bold text-foreground sm:text-sm">
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MENTORS — centred, one card each, side by side when there is
                more than one. A single fixed width keeps a lone mentor from
                stretching across the page and a pair from drifting apart. */}
            {course.instructors.length > 0 && (
              <section className="space-y-5 text-center">
                <h2 className="text-lg font-extrabold text-foreground sm:text-xl">
                  কোর্স মেন্টর
                </h2>

                <div className="flex flex-wrap items-stretch justify-center gap-4">
                  {course.instructors.map((mentor) => (
                    <div
                      key={mentor.name}
                      className="flex w-[240px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-border/80 bg-card p-5 text-center shadow-2xs transition-colors hover:border-primary/40 md:rounded-3xl"
                    >
                      <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-extrabold text-primary">
                        {mentor.image ? (
                          <Image
                            src={mentor.image}
                            alt={mentor.name}
                            width={80}
                            height={80}
                            unoptimized
                            className="size-full object-cover"
                          />
                        ) : (
                          mentorInitial(mentor.name)
                        )}
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold leading-tight text-foreground">
                          {mentor.name}
                        </h3>
                        {(mentor.role || mentor.institution) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[mentor.role, mentor.institution]
                              .filter(Boolean)
                              .join(" \u00b7 ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ROUTINE — the weekly timetable as pictures, swiped one page at
                a time. The id lets the student list deep-link straight here. */}
            {routineImages.length > 0 && (
              <section id="routine" className="scroll-mt-24 space-y-4">
                <RoutineGallery
                  images={routineImages}
                  courseTitle={course.name || course.title}
                />
              </section>
            )}
          </div>

          {/* ================= RIGHT SIDEBAR (Col Span 4) =================
              Every part of it has a twin in the fixed bottom bar on a phone —
              the name, the price, the routine link and the enrolment button —
              so on small screens it would be an empty bordered card at the
              foot of the page. Only shown where the bottom bar is switched off. */}
          <aside className="hidden lg:col-span-4 lg:block sticky top-24 space-y-5">
            <div className="bg-card rounded-2xl md:rounded-3xl p-5 sm:p-7 border-2 border-border shadow-md space-y-6">
              <div className="space-y-6">
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

                {/* Routine — jumps down to the gallery rather than opening a
                    file, because the download button lives inside it. */}
                {routineImages.length > 0 && (
                  <a
                    href="#routine"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted py-2.5 px-4 text-xs font-bold text-foreground transition-all hover:bg-muted/80"
                  >
                    <CalendarTick className="size-4 text-primary" /> রুটিন দেখুন
                  </a>
                )}
              </div>

              {/* Action Buttons — the same component the bottom bar uses, so
                  the two can never say different things. The Telegram link is
                  part of it, so help and enrolment sit side by side. */}
              <EnrollAction
                courseId={course.id}
                courseName={course.name}
                slug={slug}
                price={course.price}
                userId={session?.user?.id}
                status={enrollmentStatus}
                telegramUrl={course.telegramGroupUrl}
              />
            </div>
          </aside>
        </div>
        {/* The bar is fixed, so the page needs room left for it on phones. */}
        <div className="h-20 lg:hidden" />
      </main>

      <CourseStickyBar
        courseId={course.id}
        courseName={course.name}
        slug={slug}
        price={course.price}
        originalPrice={course.originalPrice}
        userId={session?.user?.id}
        status={enrollmentStatus}
        telegramUrl={course.telegramGroupUrl}
      />
    </div>
  );
}
