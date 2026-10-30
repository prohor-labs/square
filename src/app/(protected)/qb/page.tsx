import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import {
  ArchiveBox,
  BookOpen,
  Building,
  Calculator,
  Stethoscope,
} from "@/components/icons";
import { QbEmpty } from "@/components/qb/student/qb-empty";
import { QbHero } from "@/components/qb/student/qb-hero";
import { QbNodeGrid } from "@/components/qb/student/qb-node-grid";
import { QbShell } from "@/components/qb/student/qb-shell";
import { QbStickyTabs } from "@/components/qb/student/qb-sticky-tabs";
import { toBengaliDigits } from "@/lib/calendar-date";
import { getQbLanding, type QbSectionId } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

const ICONS: Record<QbSectionId, ReactNode> = {
  university: <Building className="size-5" aria-hidden="true" />,
  engineering: <Calculator className="size-5" aria-hidden="true" />,
  medical: <Stethoscope className="size-5" aria-hidden="true" />,
  subject: <BookOpen className="size-5" aria-hidden="true" />,
};

/** One accent per section, so the four panels read as siblings yet distinct. */
const ACCENTS: Record<
  QbSectionId,
  { tile: string; glow: string; chip: string }
> = {
  university: {
    tile: "bg-primary/12 text-primary ring-primary/20",
    glow: "from-primary/12",
    chip: "bg-primary/10 text-primary",
  },
  engineering: {
    tile: "bg-sky-500/12 text-sky-600 ring-sky-500/25",
    glow: "from-sky-500/12",
    chip: "bg-sky-500/10 text-sky-700",
  },
  medical: {
    tile: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/25",
    glow: "from-emerald-500/12",
    chip: "bg-emerald-500/10 text-emerald-700",
  },
  subject: {
    tile: "bg-amber-500/14 text-amber-600 ring-amber-500/25",
    glow: "from-amber-500/12",
    chip: "bg-amber-500/10 text-amber-700",
  },
};

/**
 * The student question bank.
 *
 * Four sections, one search box, one sticky switcher — each section is drawn
 * from what the admin actually uploaded, so an empty category says so instead
 * of advertising questions that do not exist.
 */
export default async function QbLandingPage(): Promise<ReactElement> {
  const landing = await getQbLanding();

  return (
    <QbShell>
      <QbHero />

      <QbStickyTabs
        tabs={landing.sections.map((section) => ({
          id: section.id,
          label: section.shortTitle,
          count: section.total,
        }))}
      />

      <div className="mt-8 flex flex-col gap-5 sm:gap-6">
        {landing.sections.map((section) => {
          const accent = ACCENTS[section.id];

          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              aria-labelledby={`heading-${section.id}`}
              className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-border bg-card p-4 shadow-sm shadow-black/[0.03] sm:p-6"
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-gradient-to-br ${accent.glow} to-transparent blur-2xl`}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-8 -right-4 opacity-[0.05]"
              >
                <span className="block [&>svg]:size-32">
                  {ICONS[section.id]}
                </span>
              </div>

              <div className="relative flex flex-wrap items-start gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${accent.tile}`}
                >
                  {ICONS[section.id]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id={`heading-${section.id}`}
                      className="text-lg font-black leading-tight sm:text-xl"
                    >
                      {section.title}
                    </h2>
                    {section.total > 0 ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${accent.chip}`}
                      >
                        {toBengaliDigits(section.total)}টি প্রশ্ন
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="relative mt-5">
                {section.nodes.length > 0 ? (
                  <QbNodeGrid nodes={section.nodes} />
                ) : (
                  <QbEmpty
                    title="এই বিভাগে এখনো কোনো প্রশ্ন নেই"
                    body="অ্যাডমিন প্যানেল থেকে প্রশ্ন আপলোড করলেই সেগুলো এখানে নিজে থেকেই দেখা যাবে — কোনো অতিরিক্ত কাজ লাগবে না।"
                  />
                )}
              </div>
            </section>
          );
        })}

        <footer className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ArchiveBox className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold">পুরনো প্রশ্নব্যাংক (আর্কাইভ)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  আগের ব্যাংকের বোর্ড, ভার্সিটি ও মেডিকেল প্রশ্নগুলো এখনো এখানে পড়া যায়।
                </p>
              </div>
            </div>
            <Link
              href="/qb/archive"
              className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              আর্কাইভ দেখুন
            </Link>
          </div>
        </footer>
      </div>
    </QbShell>
  );
}
