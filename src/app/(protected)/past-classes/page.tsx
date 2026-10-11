import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { BookOpen, Video } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentClasses } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** Recorded classes across every course the student is enrolled in. */
export default async function PastClassesPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const classes = userId ? await getStudentClasses(userId) : [];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          আগের ক্লাস
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          মোট {toBengaliDigits(classes.length)} টি ক্লাস · যেকোনো সময় দেখুন
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
          <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
            <BookOpen className="size-7" />
          </div>
          <p className="font-bold text-lg">এখনো কোনো ক্লাস যোগ করা হয়নি</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
            আপনার কোর্সে ক্লাস আপলোড হলে এখানে দেখা যাবে।
          </p>
          <Link href="/my-courses" className="mt-6">
            <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
              আমার কোর্স দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {classes.map((c) => (
            <a
              key={c.id}
              href={c.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-3 sm:p-4 shadow-xs hover:border-primary/50 transition-all"
            >
              <div
                className={`size-12 shrink-0 rounded-xl flex items-center justify-center ${c.isLive ? "bg-red-500/10 text-red-600" : "bg-emerald-100 text-emerald-700"}`}
              >
                <Video className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {c.batchName} · {c.subject}
                  {c.chapter ? ` · ${c.chapter}` : ""} ·{" "}
                  {toBengaliDigits(c.durationMinutes)} মিনিট
                </p>
              </div>
              {c.isLive && (
                <span className="shrink-0 text-[10px] font-bold uppercase text-red-600 bg-red-500/10 px-2 py-1 rounded-md">
                  লাইভ
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
