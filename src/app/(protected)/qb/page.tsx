import Link from "next/link";
import type { ReactElement } from "react";
import { QbNavCard } from "@/components/qb/QbNavCard";
import { getQbTree } from "@/lib/actions/qb-nav";
import { toBengaliDigits } from "@/lib/calendar-date";
import { type QbBankSlug, resolveBankSlug } from "@/lib/question-bank";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BANK_TABS: readonly { slug: string; label: string }[] = [
  { slug: "all", label: "সকল" },
  { slug: "varsity", label: "বিশ্ববিদ্যালয়" },
  { slug: "engineering", label: "ইঞ্জিনিয়ারিং" },
  { slug: "medical", label: "মেডিকেল" },
  { slug: "board", label: "বোর্ড" },
];

const BANK_ACCENT: Record<string, string> = {
  varsity: "text-indigo-500",
  engineering: "text-sky-500",
  medical: "text-rose-500",
  board: "text-emerald-500",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ bank?: string }>;
}): Promise<ReactElement> {
  const { bank } = (await searchParams) ?? {};
  const active = BANK_TABS.some((tab) => tab.slug === bank) ? bank : "all";

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

      {/* Bank tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-b pb-2">
        {BANK_TABS.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <Link
              key={tab.slug}
              href={tab.slug === "all" ? "/qb" : `/qb?bank=${tab.slug}`}
              scroll={false}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
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
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {visible.map((container) => (
            <QbNavCard
              key={container.id}
              href={`/qb/${container.slug}`}
              title={container.title}
              meta={`${toBengaliDigits(container.units.length)} টি ইউনিট`}
              questions={container.questions}
              icon="stack"
              accent={BANK_ACCENT[resolveBankSlug(container.slug)]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
