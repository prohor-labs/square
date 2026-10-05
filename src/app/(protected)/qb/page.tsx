import Link from "next/link";
import type { ReactElement } from "react";
import { BookOpen, Calculator, GradCap, Stethoscope } from "@/components/icons";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { toBengaliDigits } from "@/lib/calendar-date";
import {
  groupContainersByBank,
  QB_BANKS,
  type QbBankGroup,
  type QbBankSlug,
} from "@/lib/question-bank";

export const dynamic = "force-dynamic";

const BANK_ICONS = {
  varsity: GradCap,
  engineering: Calculator,
  medical: Stethoscope,
  board: BookOpen,
} satisfies Record<QbBankSlug, typeof GradCap>;

function BankCard({ group }: { group: QbBankGroup }) {
  const { meta, containers } = group;
  const Icon = BANK_ICONS[meta.slug];

  const totalQuestions = containers.reduce(
    (acc, c) => acc + (c.questionsCount ?? 0),
    0,
  );
  const isEmpty = containers.length === 0;

  return (
    <Link
      href={`/qb/bank/${meta.slug}`}
      className={`group relative overflow-hidden rounded-[20px] md:rounded-[28px] p-5 sm:p-6 md:p-7 flex flex-col justify-between gap-6 aspect-square text-white shadow-lg border border-border/50 transition-all duration-300 ${
        isEmpty
          ? "opacity-60"
          : "hover:shadow-2xl hover:-translate-y-1 active:scale-95 cursor-pointer"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="size-12 sm:size-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
          <Icon className="size-6 sm:size-7" />
        </div>
        {isEmpty ? (
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/25 border border-white/20">
            আসছে
          </span>
        ) : (
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-md">
            {containers.length} টি কন্টেইনার
          </span>
        )}
      </div>

      <div className="relative z-10 my-auto">
        <h3 className="font-black text-[17px] sm:text-[20px] md:text-[22px] lg:text-[24px] leading-tight drop-shadow-md line-clamp-2">
          {meta.label}
        </h3>
        <p className="text-white/85 text-[11px] sm:text-[13px] font-medium mt-2 line-clamp-2 leading-snug">
          {meta.description}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-[10px] sm:text-xs text-white/90 font-semibold bg-black/20 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-white/10 self-start">
        <span>{toBengaliDigits(totalQuestions)} টি প্রশ্ন</span>
      </div>
    </Link>
  );
}

export default async function QuestionBankPage(): Promise<ReactElement> {
  const containers = await getUserQbContainers();
  const groups = groupContainersByBank(containers);

  const totalQuestions = containers.reduce(
    (acc, c) => acc + (c.questionsCount ?? 0),
    0,
  );

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          মোট {toBengaliDigits(totalQuestions)} টি প্রশ্ন — সব ছাত্রের জন্য উন্মুক্ত
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full">
        {QB_BANKS.map((meta) => (
          <BankCard
            key={meta.slug}
            group={
              groups.find((g) => g.meta.slug === meta.slug) ?? {
                meta,
                containers: [],
              }
            }
          />
        ))}
      </div>
    </div>
  );
}
