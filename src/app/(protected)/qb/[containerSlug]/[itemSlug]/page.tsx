import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { QbPaletteKey } from "@/components/qb/QbGradientCard";
import { QbGradientCard } from "@/components/qb/QbGradientCard";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";
import {
  type QbBankSlug,
  resolveBankSlug,
  unitLabel,
} from "@/lib/question-bank";

export const dynamic = "force-dynamic";

const BANK_PALETTE: Record<QbBankSlug, QbPaletteKey> = {
  varsity: "varsity",
  engineering: "engineering",
  medical: "medical",
  board: "board",
};

/** Level 3 — the years or chapters inside one unit. */
export default async function QbChaptersPage({
  params,
}: {
  params: Promise<{ containerSlug: string; itemSlug: string }>;
}): Promise<ReactElement> {
  const { containerSlug, itemSlug } = await params;
  const tree = await getQbTree();
  const container = tree.find((node) => node.slug === containerSlug);
  if (!container) notFound();

  const unit = container.units.find((node) => node.slug === itemSlug);
  if (!unit) notFound();

  const label = unitLabel(unit.name, container.title);
  const palette =
    BANK_PALETTE[resolveBankSlug(container.slug) as QbBankSlug] ?? "neutral";

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-5">
      <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground flex-wrap">
        <Link href="/qb" className="hover:text-primary transition-colors">
          প্রশ্নব্যাংক
        </Link>
        <span>/</span>
        <Link
          href={`/qb/${container.slug}`}
          className="hover:text-primary transition-colors"
        >
          {container.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{label}</span>
      </nav>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
          {label}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {toBengaliDigits(unit.chapters.length)} টি অধ্যায় · মোট{" "}
          {toBengaliDigits(unit.questions)} টি প্রশ্ন
        </p>
      </div>

      {unit.chapters.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/10">
          <p className="font-bold text-base text-foreground">
            এখানে কোনো অধ্যায় নেই
          </p>
        </div>
      ) : (
        /* Years are a long list, so they read better as a compact column of
           flat boxes than as a grid of near-identical squares. */
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-2xl">
          {unit.chapters.map((chapter) => (
            <QbGradientCard
              key={chapter.id}
              href={`/qb/${container.slug}/${unit.slug}/${chapter.slug}`}
              title={chapter.name}
              subtitle={label}
              questions={chapter.questions}
              palette={palette}
              variant="row"
            />
          ))}
        </div>
      )}
    </div>
  );
}
