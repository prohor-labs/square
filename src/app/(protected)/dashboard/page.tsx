import Link from "next/link";
import { DashboardMoreMenu } from "@/components/dashboard/dashboard-more-menu";
import {
  QB_CARD_COLORS,
  QB_SQUARE_BLOBS,
  QbCardShapes,
} from "@/components/qb/card-skin";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

const SHORTCUTS = [
  {
    href: "/exams",
    label: "পরীক্ষার সমূহ",
    note: "তোমার কোর্সের মধ্যে থাকা সবগুলো পরীক্ষা এখানে দেখতে পারো",
  },
  { href: "/exams?tab=practice", label: "প্র্যাকটিস পরীক্ষা" },
  { href: "/my-results", label: "আর্কাইভ পরীক্ষা" },
  { href: "/wrong-answers", label: "ভুল ব্যাংক" },
  { href: "/performance", label: "পারফরমেন্স রিপোর্ট" },
] as const;

export default async function DashboardPage() {
  const banks = await getQbTree();
  const questionCount = banks.reduce((sum, b) => sum + b.questions, 0);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 pb-16">
      <div className="flex items-start justify-between gap-3">
        {/* Question bank card — same red-and-white skin as the bank grid. */}
        <Link
          href="/qb"
          className="group relative flex aspect-[5/3] w-full max-w-sm flex-col justify-end overflow-hidden rounded-3xl p-5 shadow-sm transition-transform hover:-translate-y-0.5"
          style={{ background: QB_CARD_COLORS.background }}
        >
          <QbCardShapes blobs={QB_SQUARE_BLOBS} />
          <p
            className="relative z-10 text-sm font-bold"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            প্রশ্নব্যাংক
          </p>
          <h1
            className="relative z-10 text-2xl font-black md:text-3xl"
            style={{ color: QB_CARD_COLORS.text }}
          >
            প্রশ্নব্যাংক দেখুন
          </h1>
          <p
            className="relative z-10 text-sm"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            {toBengaliDigits(questionCount)}+ প্রশ্ন
          </p>
        </Link>

        <DashboardMoreMenu />
      </div>

      <nav className="flex flex-col gap-3">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 flex-col items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-center transition-colors hover:bg-accent md:min-h-[76px]"
          >
            <span className="text-base font-semibold md:text-lg">
              {item.label}
            </span>
            {"note" in item && (
              <span className="mt-0.5 text-xs text-muted-foreground">
                {item.note}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
