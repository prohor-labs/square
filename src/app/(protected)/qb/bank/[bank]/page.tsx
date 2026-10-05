import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { BookOpen, Calculator, GradCap, Stethoscope } from "@/components/icons";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { toBengaliDigits } from "@/lib/calendar-date";
import {
  getBankMeta,
  type QbBankSlug,
  resolveBankSlug,
} from "@/lib/question-bank";

export const dynamic = "force-dynamic";

const BANK_ICONS = {
  varsity: GradCap,
  engineering: Calculator,
  medical: Stethoscope,
  board: BookOpen,
} satisfies Record<QbBankSlug, typeof GradCap>;

export default async function QbBankPage({
  params,
}: {
  params: Promise<{ bank: string }>;
}): Promise<ReactElement> {
  const { bank } = await params;
  const meta = getBankMeta(bank);
  if (!meta) notFound();

  const containers = await getUserQbContainers();
  const inBank = containers.filter(
    (c) => resolveBankSlug(c.slug, c.standardCounts) === meta.slug,
  );

  const Icon = BANK_ICONS[meta.slug];
  const totalQuestions = inBank.reduce(
    (acc, c) => acc + (c.questionsCount ?? 0),
    0,
  );

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <span className="text-foreground">{meta.label}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`size-11 md:size-12 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md`}
          >
            <Icon className="size-5 md:size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
              {meta.label}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {meta.description} · মোট {toBengaliDigits(totalQuestions)} টি প্রশ্ন
            </p>
          </div>
        </div>
      </div>

      {inBank.length === 0 ? (
        <div className="py-16 sm:py-24 px-6 text-center border border-dashed rounded-3xl text-muted-foreground bg-card/50 flex flex-col items-center justify-center gap-3">
          <div
            className={`size-12 rounded-2xl bg-gradient-to-br ${meta.gradient} opacity-40 text-white flex items-center justify-center`}
          >
            <Icon className="size-6" />
          </div>
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            এই ব্যাংকে এখনো কোনো প্রশ্ন যোগ করা হয়নি
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            অ্যাডমিন প্যানেল থেকে এই ক্যাটাগরিতে প্রশ্ন আপলোড করলে সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
          {inBank.map((c) => (
            <Link
              key={c.id}
              href={`/qb/${c.slug}`}
              className="group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-4 sm:p-5 md:p-6 aspect-square flex flex-col items-center justify-center text-center text-white shadow-lg border border-border/50 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300`}
              />

              <div className="relative z-10 flex flex-col items-center justify-center px-1 sm:px-2 w-full my-auto">
                <h3 className="font-black text-[15px] sm:text-[18px] md:text-[20px] leading-tight drop-shadow-md line-clamp-3">
                  {c.title}
                </h3>
                {c.description && (
                  <p className="text-white/85 text-[11px] sm:text-[13px] font-medium mt-1.5 line-clamp-2 leading-snug">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-2 text-[10px] sm:text-xs text-white/90 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                <span>{toBengaliDigits(c.itemsCount ?? 0)} টি বিষয়</span>
                <span>•</span>
                <span>{toBengaliDigits(c.questionsCount ?? 0)} টি প্রশ্ন</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
