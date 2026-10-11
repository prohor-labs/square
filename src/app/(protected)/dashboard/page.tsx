import Link from "next/link";
import { ArchiveBox, Chart, Clipboard, Danger } from "@/components/icons";
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
    note: "লাইভ এক্সাম, আপকামিং এক্সাম এবং প্র্যাকটিস এক্সাম দেখো",
    Icon: Clipboard,
  },
  {
    href: "/archive",
    label: "আর্কাইভ পরীক্ষা",
    note: "আর্কাইভ পরীক্ষা গুলো দেখো",
    Icon: ArchiveBox,
  },
  {
    href: "/wrong-answers",
    label: "ভুল ব্যাংক",
    note: "যে সকল পরীক্ষায় তোমার ভুল হয়েছে সেই সকল প্রশ্ন ও উত্তর এখানে দেখো",
    Icon: Danger,
  },
  { href: "/performance", label: "পারফরমেন্স রিপোর্ট", Icon: Chart },
] as const;

export default async function DashboardPage() {
  const banks = await getQbTree();
  const questionCount = banks.reduce((sum, b) => sum + b.questions, 0);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 pb-16">
      {/* Hero — the question bank, in three lines. */}
      <Link
        href="/qb"
        className="group relative flex aspect-[16/9] flex-col justify-center gap-1 overflow-hidden rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-0.5 md:aspect-[2/1] md:p-8"
        style={{ background: QB_CARD_COLORS.background }}
      >
        <QbCardShapes blobs={QB_SQUARE_BLOBS} />
        <p
          className="relative z-10 text-sm font-bold"
          style={{ color: QB_CARD_COLORS.subText }}
        >
          প্রশ্নব্যাংক
        </p>
        <p
          className="relative z-10 text-2xl font-black md:text-3xl"
          style={{ color: QB_CARD_COLORS.text }}
        >
          প্রশ্নব্যাংক দেখুন
        </p>
        <p
          className="relative z-10 text-base font-medium"
          style={{ color: QB_CARD_COLORS.subText }}
        >
          মোট {toBengaliDigits(questionCount)}+ প্রশ্ন
        </p>
      </Link>

      {/* Shortcuts — squarer than before, each with its own icon. */}
      <nav className="flex flex-col gap-2.5">
        {SHORTCUTS.map((item) => {
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-16 items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent md:min-h-[72px] md:px-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-base font-semibold md:text-lg">
                  {item.label}
                </span>
                {"note" in item && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.note}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
