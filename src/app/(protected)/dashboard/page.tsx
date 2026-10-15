import Link from "next/link";
import {
  ArchiveBox,
  Chart,
  Clipboard,
  Danger,
  SquareLogo,
  TaskSquare,
  Video,
} from "@/components/icons";
import { NotReadyCard } from "@/components/not-ready";
import {
  QB_CARD_COLORS,
  QB_SQUARE_BLOBS,
  QbCardShapes,
} from "@/components/qb/card-skin";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/* Each shortcut gets its own gradient so the list reads as a set of cards
   rather than five identical bars. */
const SHORTCUTS = [
  {
    href: "/live-classes",
    label: "লাইভ ক্লাস (রেকর্ডেড ক্লাস)",
    Icon: Video,
    chip: "from-emerald-500 to-green-600 shadow-emerald-500/30",
    disabled: true,
  },
  {
    href: "/exams",
    label: "পরীক্ষার সমূহ",
    note: "লাইভ এক্সাম, আপকামিং এক্সাম এবং প্র্যাকটিস এক্সাম দেখো",
    Icon: Clipboard,
    chip: "from-violet-500 to-fuchsia-500 shadow-violet-500/30",
    disabled: false,
  },
  {
    href: "/archive",
    label: "আর্কাইভ পরীক্ষা",
    note: "আর্কাইভ পরীক্ষা গুলো দেখো",
    Icon: ArchiveBox,
    chip: "from-amber-500 to-orange-500 shadow-amber-500/30",
    disabled: false,
  },
  {
    href: "/wrong-answers",
    label: "ভুল ব্যাংক",
    note: "যে সকল পরীক্ষায় তোমার ভুল হয়েছে সেই সকল প্রশ্ন ও উত্তর এখানে দেখো",
    Icon: Danger,
    chip: "from-rose-500 to-red-600 shadow-rose-500/30",
    disabled: false,
  },
  {
    href: "/performance",
    label: "পারফরমেন্স রিপোর্ট",
    Icon: Chart,
    chip: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
    disabled: false,
  },
] as const;

const CARD_CLASS =
  "group flex min-h-16 w-full items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:px-5";

export default async function DashboardPage() {
  const banks = await getQbTree();
  const questionCount = banks.reduce((sum, b) => sum + b.questions, 0);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 pb-16">
      {/* Brand — the same mark and name as the header and the sidebar. */}
      <div className="flex items-center gap-3 pb-1">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border/60">
          <SquareLogo className="size-full object-contain p-[7%]" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-xl font-black tracking-tight">স্কয়ার</span>
          <span className="mt-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            Engr. Platform
          </span>
        </span>
      </div>

      {/* Hero — the question bank, in three lines. */}
      <Link
        href="/qb"
        className="group relative flex aspect-[3/1] items-center gap-4 overflow-hidden rounded-2xl p-4 shadow-md transition-shadow hover:shadow-xl md:p-5"
        style={{ background: QB_CARD_COLORS.background }}
      >
        <QbCardShapes blobs={QB_SQUARE_BLOBS} />
        <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/30 shadow-sm">
          <TaskSquare
            size={26}
            color={QB_CARD_COLORS.text}
            className="drop-shadow-sm"
          />
        </span>
        <span className="relative z-10 min-w-0">
          <span
            className="block text-[11px] font-bold uppercase tracking-wide"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            প্রশ্নব্যাংক
          </span>
          <span
            className="block truncate text-lg font-black md:text-xl"
            style={{ color: QB_CARD_COLORS.text }}
          >
            প্রশ্নব্যাংক দেখুন
          </span>
          <span
            className="block text-xs font-medium"
            style={{ color: QB_CARD_COLORS.subText }}
          >
            মোট {toBengaliDigits(questionCount)}+ প্রশ্ন
          </span>
        </span>
      </Link>

      {/* Shortcuts */}
      <nav className="flex flex-col gap-2.5">
        {SHORTCUTS.map((item) => {
          const { Icon } = item;
          const inner = (
            <>
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105 ${item.chip}`}
              >
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
              <Arrow />
            </>
          );

          return item.disabled ? (
            <NotReadyCard
              key={item.href}
              className={`${CARD_CLASS} cursor-not-allowed opacity-70 hover:translate-y-0 hover:shadow-sm`}
            >
              {inner}
            </NotReadyCard>
          ) : (
            <Link key={item.href} href={item.href} className={CARD_CLASS}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Small chevron that leans right on hover. */
function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
