import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { CalendarTick } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentRoutines } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** The routine PDF of every course the student is enrolled in. */
export default async function RoutinePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const routines = userId ? await getStudentRoutines(userId) : [];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          কোর্সের রুটিন
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {toBengaliDigits(routines.length)} টি কোর্সের রুটিন
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
        <div className="flex flex-col gap-3">
          {routines.map((routine) => (
            <Link
              key={routine.batchId}
              // Straight to the timetable itself: a course with pictures goes
              // to the gallery, one without falls back to the old link.
              href={
                routine.hasImages
                  ? `/courses/${routine.slug}#routine`
                  : routine.routineUrl
              }
              {...(routine.hasImages
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              className="flex min-h-16 items-center justify-between gap-3 rounded-full border border-border bg-card px-6 py-3 text-center transition-colors hover:bg-accent"
            >
              <span className="min-w-0 flex-1 text-base font-semibold md:text-lg">
                {routine.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                রুটিন দেখুন
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
