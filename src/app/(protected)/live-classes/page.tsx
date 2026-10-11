import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { BookOpen, Video } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentClasses } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** Classes flagged live by an admin, newest first. */
export default async function LiveClassesPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const classes = userId ? await getStudentClasses(userId) : [];
  const live = classes.filter((c) => c.isLive);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          লাইভ ক্লাস
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          চলমান ক্লাসগুলো এখানে দেখা যাবে
        </p>
      </div>

      {live.length === 0 ? (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
          <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
            <Video className="size-7" />
          </div>
          <p className="font-bold text-lg">এই মুহূর্তে কোনো লাইভ ক্লাস নেই</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
            কোর্সে নতুন ক্লাস লাইভ হলে এখানে দেখা যাবে।
          </p>
          <Link href="/my-courses" className="mt-6">
            <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
              আমার কোর্স দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {live.map((c) => (
            <a
              key={c.id}
              href={c.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-primary/50 transition-all"
            >
              <div className="relative size-14 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-red-500/10 animate-ping" />
                <Video className="size-6 text-red-600 relative" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-red-600 uppercase">
                  লাইভ এখন
                </p>
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {c.batchName} · {c.subject} ·{" "}
                  {toBengaliDigits(c.durationMinutes)} মিনিট
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {classes.length > live.length && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="size-4" />
          আগের সব ক্লাস দেখতে{" "}
          <Link href="/past-classes" className="text-primary font-bold">
            আগের ক্লাস
          </Link>{" "}
          পাতাটিতে যান
        </p>
      )}
    </div>
  );
}
