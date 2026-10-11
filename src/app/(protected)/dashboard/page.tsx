import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** The four shortcuts the sketch puts under the summary row. */
const SHORTCUTS = [
  { href: "/live-classes", label: "লাইভ ক্লাস (সময়সূচি ও ক্লাস)" },
  { href: "/pdf", label: "কোর্স সাজেশন ও পিডিএফ" },
  { href: "/qb", label: "ইনফো সংগ্রহ" },
  { href: "/my-results", label: "আর্কাইভ এক্সাম" },
] as const;

export default async function DashboardPage() {
  const banks = await getQbTree();

  const banksCount = banks.length;
  const questionCount = banks.reduce((sum, b) => sum + b.questions, 0);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 pb-16">
      <section className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        {/* Left — greeting */}
        <div className="relative flex min-h-44 flex-col justify-center overflow-hidden rounded-3xl border border-border bg-card p-6 md:min-h-48 md:p-8">
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-base text-muted-foreground md:text-lg">
            প্রিয় শিক্ষার্থী, স্বাগতম
          </p>

          {/* Hatched quarter-round in the bottom-right corner. */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 size-28 rounded-tl-full text-foreground opacity-15 [mask-image:linear-gradient(135deg,#000_32%,transparent_80%)] bg-[repeating-linear-gradient(to_bottom,currentColor_0_1px,transparent_1px_8px)]"
          />
        </div>

        {/* Right — question bank summary + practice */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              প্রশ্নব্যাংক
            </p>
            <p className="text-3xl font-black tracking-tight md:text-4xl">
              সর্বমোট: {toBengaliDigits(banksCount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {toBengaliDigits(questionCount)}+ প্রশ্ন
            </p>
          </div>

          <Button
            render={<Link href="/exams?tab=practice" />}
            className="h-12 w-full rounded-full text-base font-semibold"
          >
            প্র্যাকটিস পরীক্ষা
          </Button>
        </div>
      </section>

      {/* Shortcuts */}
      <nav className="flex flex-col gap-3">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 items-center justify-center rounded-full border border-border bg-card px-6 py-4 text-center text-base font-semibold transition-colors hover:bg-accent md:min-h-[76px] md:text-lg"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
