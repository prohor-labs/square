import Link from "next/link";
import type { ReactElement } from "react";
import { QbCard } from "@/components/qb/QbCard";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";
import {
  QB_BANKS,
  type QbBankSlug,
  resolveBankSlug,
} from "@/lib/question-bank";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** "সকল" plus one tab per bank, in the order the banks are declared. */
const TABS: readonly { slug: string; label: string }[] = [
  { slug: "all", label: "সকল" },
  ...QB_BANKS.map((bank) => ({
    slug: bank.slug,
    label: bank.label.replace(" প্রশ্ন ব্যাংক", ""),
  })),
];

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ bank?: string }>;
}): Promise<ReactElement> {
  const { bank } = (await searchParams) ?? {};
  const active = TABS.some((tab) => tab.slug === bank) ? bank : "all";

  const tree = await getQbTree();
  const visible =
    active === "all"
      ? tree
      : tree.filter(
          (container) =>
            resolveBankSlug(container.slug) === (active as QbBankSlug),
        );

  const totalQuestions = tree.reduce((sum, c) => sum + c.questions, 0);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          মোট {toBengaliDigits(totalQuestions)} টি প্রশ্ন · সব ছাত্রের জন্য উন্মুক্ত
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-b pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab.slug}
            href={tab.slug === "all" ? "/qb" : `/qb?bank=${tab.slug}`}
            scroll={false}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-colors",
              tab.slug === active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-muted/10">
          <p className="font-bold text-base sm:text-lg text-foreground">
            এই ব্যাংকে এখনো কিছু যোগ করা হয়নি
          </p>
          <p className="text-xs sm:text-sm mt-1.5">
            অ্যাডমিন প্যানেল থেকে প্রশ্ন আপলোড করলে সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        /* Two per row, capped so the square cards stay card-sized on a wide screen
           instead of stretching to 600px. */
        <div className="grid max-w-xl grid-cols-2 gap-2.5 sm:gap-3">
          {visible.map((container) => (
            <QbCard
              key={container.id}
              href={`/qb/${container.slug}`}
              title={container.title}
              subtitle="প্রশ্নব্যাংক"
              questions={container.questions}
              variant="wide"
            />
          ))}
        </div>
      )}
    </div>
  );
}
