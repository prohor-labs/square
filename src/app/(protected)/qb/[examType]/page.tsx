import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbCard } from "@/components/qb/QbCard";
import type { QbExamType } from "@/db/schema";
import { getInstitutesByType } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  board: {
    title: "বোর্ড প্রশ্ন ব্যাংক",
    subtitle: "গ্রুপ ও বোর্ড অনুযায়ী",
  },
  university: {
    title: "ভার্সিটি প্রশ্ন ব্যাংক",
    subtitle: "বিশ্ববিদ্যালয় ও ইউনিট অনুযায়ী",
  },
  engineering: {
    title: "ইঞ্জিনিয়ারিং প্রশ্ন ব্যাংক",
    subtitle: "প্রতিষ্ঠান ও গ্রুপ অনুযায়ী",
  },
  medical: {
    title: "মেডিকেল প্রশ্ন ব্যাংক",
    subtitle: "বছর অনুযায়ী",
  },
};

/**
 * One page per exam, same shape: the boards or universities that hold questions
 * for it, each carrying how many years it has.
 *
 * There is no page per group or per year. A group is three cards and a year is a
 * filter, so drilling into either would be a page that exists only to be left
 * again — the institute page takes the year straight from its filter.
 */
export default async function QbExamPage({
  params,
}: {
  params: Promise<{ examType: string }>;
}): Promise<ReactElement> {
  const { examType } = await params;
  const meta = TITLES[examType];
  if (!meta) notFound();

  const type = examType as QbExamType;
  const institutes = await getInstitutesByType(type);

  const total = institutes.reduce((sum, i) => sum + i.institute.questions, 0);
  return (
    <div className="flex w-full max-w-5xl flex-col gap-6 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[{ label: "প্রশ্নব্যাংক", href: "/qb" }, { label: meta.title }]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {meta.title}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {meta.subtitle} · মোট {toBengaliDigits(total)} টি প্রশ্ন
        </p>
      </div>

      {institutes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-bold text-foreground">
            এই ব্যাংকে এখনো কোনো প্রশ্ন যুক্ত হয়নি
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            অ্যাডমিন প্যানেল থেকে আপলোড করলে এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <>
          {/* Boards first, then the universities and institutes. Within a page
              the cards are the only choice on offer, so they get the space. */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {institutes.map(({ institute, groups, years }) => (
              <QbCard
                key={institute.id}
                href={`/qb/institutes/${institute.slug}`}
                title={institute.name}
                subtitle={
                  years > 0
                    ? `${toBengaliDigits(years)} বছর${
                        groups.length ? ` · ${groups.join(", ")}` : ""
                      }`
                    : "প্রশ্ন নেই"
                }
                questions={institute.questions}
                variant="compact"
              />
            ))}
          </div>

          {type === "medical" && (
            <p className="text-xs text-muted-foreground">
              মেডিকেল প্রশ্নে বছরই প্রধান ভাগ — পরবর্তী পাতায় বছর ও বিষয় ফিল্টার করে নিতে
              পারবেন।
            </p>
          )}
        </>
      )}
    </div>
  );
}
