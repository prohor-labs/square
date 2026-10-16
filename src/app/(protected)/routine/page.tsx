import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import {
  ArrowRight2,
  BookOpen,
  CalendarTick,
  FileDown,
  Teacher,
  TickCircle,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentRoutines } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** The stored category is English; the page reads better in Bengali. */
const CATEGORY: Readonly<Record<string, string>> = {
  Academic: "একাডেমিক",
  Admission: "এডমিশন",
};

/** The routine PDF of every course the student is enrolled in. */
export default async function RoutinePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const routines = userId ? await getStudentRoutines(userId) : [];

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6 pb-16 sm:gap-8">
      <div className="flex flex-col gap-1 border-b pb-5">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          কোর্সের রুটিন
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {routines.length === 0
            ? "কোনো রুটিন পাওয়া যায়নি"
            : `আপনার ${toBengaliDigits(routines.length)} টি কোর্সের রুটিন — প্রতিটি আলাদা ট্যাবে খুলবে`}
        </p>
      </div>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-primary">
            <CalendarTick className="size-7" />
          </div>
          <p className="text-lg font-bold">কোনো রুটিন পাওয়া যায়নি</p>
          <p className="max-w-md text-xs text-muted-foreground md:text-sm">
            কোর্সে ভর্তি হলে এখানে রুটিন দেখা যাবে।
          </p>
          <Link href="/my-courses">
            <Button className="rounded-xl px-6 font-semibold">
              আমার কোর্স দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {routines.map((routine) => (
            <article
              key={routine.batchId}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              {/* The batches ship a square logo as their picture, so the frame
                  contains rather than crops it — a cover crop of a wordmark
                  loses the letters off the edge. */}
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted via-background to-muted">
                <Image
                  src={routine.image || "/images/image.png"}
                  alt={routine.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    {CATEGORY[routine.hscBatch] ?? routine.hscBatch}
                  </span>
                  {routine.badge && (
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-xs">
                      {routine.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl">
                    {routine.title}
                  </h2>
                  {routine.subtitle && routine.subtitle !== "-" && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {routine.subtitle}
                    </p>
                  )}
                </div>

                {routine.mentors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {routine.mentors.map((mentor) => (
                      <span
                        key={`${mentor.name}|${mentor.institution ?? ""}`}
                        className="flex items-center gap-1.5"
                      >
                        <Teacher className="size-3.5 shrink-0 text-primary" />
                        <span className="font-medium">{mentor.name}</span>
                        {mentor.institution && (
                          <span className="text-muted-foreground/80">
                            · {mentor.institution}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {routine.features.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {routine.features.slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <TickCircle className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <span className="line-clamp-2">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row">
                  <a
                    href={routine.routineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="h-10 w-full gap-1.5 rounded-xl text-xs font-semibold shadow-xs sm:text-sm">
                      <FileDown className="size-4" />
                      রুটিন দেখুন
                    </Button>
                  </a>

                  <Link
                    href={`/my-courses/${routine.batchId}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="h-10 w-full gap-1.5 rounded-xl text-xs font-semibold sm:text-sm"
                    >
                      <BookOpen className="size-4 text-primary" />
                      ক্লাসরুমে যান
                      <ArrowRight2 className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
