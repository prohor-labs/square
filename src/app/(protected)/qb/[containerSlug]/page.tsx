import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbNavCard } from "@/components/qb/QbNavCard";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";
import { unitLabel } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

/**
 * Level 2 — the units inside one container (a university, institute or subject
 * pool). The unit level is always shown, even when a container has a single
 * unit, so the path stays the same shape everywhere.
 */
export default async function QbUnitsPage({
  params,
}: {
  params: Promise<{ containerSlug: string }>;
}): Promise<ReactElement> {
  const { containerSlug } = await params;
  const tree = await getQbTree();
  const container = tree.find((node) => node.slug === containerSlug);

  if (!container) notFound();

  const total = container.units.reduce((sum, unit) => sum + unit.questions, 0);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-5">
      <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
        <Link href="/qb" className="hover:text-primary transition-colors">
          প্রশ্নব্যাংক
        </Link>
        <span>/</span>
        <span className="text-foreground">{container.title}</span>
      </nav>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
          {container.title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {toBengaliDigits(container.units.length)} টি ইউনিট · মোট{" "}
          {toBengaliDigits(total)} টি প্রশ্ন
        </p>
      </div>

      {container.units.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/10">
          <p className="font-bold text-base text-foreground">
            এখানে কোনো ইউনিট নেই
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {container.units.map((unit) => (
            <QbNavCard
              key={unit.id}
              href={`/qb/${container.slug}/${unit.slug}`}
              title={unitLabel(unit.name, container.title)}
              meta={`${toBengaliDigits(unit.chapters.length)} টি অধ্যায়`}
              questions={unit.questions}
              icon="layers"
            />
          ))}
        </div>
      )}
    </div>
  );
}
