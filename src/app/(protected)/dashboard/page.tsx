import Link from "next/link";
import {
  ArchiveBox,
  Chart,
  Clipboard,
  Danger,
  Send,
  SquareLogo,
  Video,
} from "@/components/icons";
import { NotReadyCard } from "@/components/not-ready";
import {
  QB_CARD_COLORS,
  QB_SQUARE_BLOBS,
  QbCardShapes,
} from "@/components/qb/card-skin";
import { getCachedSession } from "@/lib/auth-session";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbTotal } from "@/lib/qb-catalog";
import { getStudentTelegramGroups } from "@/lib/telegram-groups";

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
  const session = await getCachedSession();
  const [questionCount, telegramGroups] = await Promise.all([
    getQbTotal(),
    session?.user
      ? getStudentTelegramGroups(session.user.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 pb-16">
      {/* Hero — the brand on the left, the question bank in three lines on the
          right, in one card rather than a separate block above it. */}
      <Link
        href="/qb"
        className="group relative flex aspect-[3/1] items-center gap-3 overflow-hidden rounded-2xl p-4 shadow-md transition-shadow hover:shadow-xl md:gap-4 md:p-5"
        style={{ background: QB_CARD_COLORS.background }}
      >
        <QbCardShapes blobs={QB_SQUARE_BLOBS} />

        <span className="relative z-10 flex shrink-0 items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/70 p-1.5 shadow-sm">
            <SquareLogo className="size-full object-contain" />
          </span>
          <span className="flex flex-col leading-none">
            <span
              className="text-base font-black tracking-tight"
              style={{ color: QB_CARD_COLORS.text }}
            >
              স্কয়ার
            </span>
            <span
              className="mt-1 text-[9px] font-bold tracking-wide uppercase"
              style={{ color: QB_CARD_COLORS.subText }}
            >
              Engr. Platform
            </span>
          </span>
        </span>

        <span
          aria-hidden
          className="relative z-10 h-10 w-px shrink-0 bg-black/15"
        />

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
            মোট {toBengaliDigits(questionCount)} প্রশ্ন
          </span>
        </span>
      </Link>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Send className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold sm:text-lg">
              আমার প্রাইভেট Telegram গ্রুপ
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              তোমার এনরোল করা কোর্সের গ্রুপ লিংক এখানে পাবে।
            </p>
          </div>
        </div>

        {telegramGroups.length > 0 ? (
          <div className="mt-4 grid gap-2.5">
            {telegramGroups.map((group) => (
              <a
                key={group.batchId}
                href={group.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-16 items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-md sm:px-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Send className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold sm:text-base">
                    {group.courseName}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    প্রাইভেট কোর্স গ্রুপ
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-blue-700">
                  গ্রুপে যোগ দিন
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-foreground">
              এখনও কোনো প্রাইভেট গ্রুপ লিংক নেই
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              কোর্সে এনরোল করে অ্যাডমিন গ্রুপ লিংক দিলে এটি এখানে দেখাবে।
            </p>
          </div>
        )}
      </section>

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
