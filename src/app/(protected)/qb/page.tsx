import type { ReactElement } from "react";
import {
  BookOpen,
  Building,
  Calculator,
  GradCap,
  Grid,
  User,
} from "@/components/icons";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbCard } from "@/components/qb/QbCard";
import { QbCategoryCard } from "@/components/qb/QbCategoryCard";
import { QbSearchBar } from "@/components/qb/QbSearchBar";
import {
  getQbHomeCards,
  getSubjectsWithCounts,
} from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/**
 * The front door.
 *
 * Five cards for the five kinds of exam, and a search box above them because
 * more often than not a student already knows what they are looking for. The
 * counts are real, read from the bank, and they overlap on purpose — the same
 * question can be counted under a board paper and under its chapter.
 */
export default async function QuestionBankPage(): Promise<ReactElement> {
  const [counts, subjects] = await Promise.all([
    getQbHomeCards(),
    getSubjectsWithCounts(),
  ]);

  const subjectTotal = subjects.reduce((sum, s) => sum + s.questions, 0);
  const empty = counts.total === 0;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 pb-12 pt-2 md:py-8">
      <QbBreadcrumb items={[{ label: "প্রশ্নব্যাংক" }]} />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          প্রয়োজনীয় প্রশ্ন খুঁজে নাও, অনুশীলন করো, প্রস্তুতি এগিয়ে নাও
        </p>
      </div>

      {empty ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-bold text-foreground sm:text-base">
            এখনো কোনো প্রশ্ন যোগ করা হয়নি
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            অ্যাডমিন প্যানেল থেকে প্রশ্ন আপলোড করলে সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <>
          <QbSearchBar className="max-w-2xl" />

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              পরীক্ষা অনুযায়ী
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <QbCategoryCard
                href="/qb/board"
                title="বোর্ড প্রশ্ন ব্যাংক"
                description="গ্রুপ, বোর্ড ও বছর অনুযায়ী"
                questions={counts.board}
                icon={Building}
              />
              <QbCategoryCard
                href="/qb/university"
                title="ভার্সিটি প্রশ্ন ব্যাংক"
                description="বিশ্ববিদ্যালয় ও ইউনিট অনুযায়ী"
                questions={counts.university}
                icon={GradCap}
              />
              <QbCategoryCard
                href="/qb/engineering"
                title="ইঞ্জিনিয়ারিং প্রশ্ন ব্যাংক"
                description="প্রতিষ্ঠান ও গ্রুপ অনুযায়ী"
                questions={counts.engineering}
                icon={Calculator}
              />
              <QbCategoryCard
                href="/qb/medical"
                title="মেডিকেল প্রশ্ন ব্যাংক"
                description="বছর ও বিষয় অনুযায়ী"
                questions={counts.medical}
                icon={User}
              />
              <QbCategoryCard
                href="/qb/mixed"
                title="বিভিন্ন পরীক্ষার প্রশ্ন"
                description="যেগুলো কোনো একটি বোর্ডের নয়"
                questions={counts.mixed}
                icon={Grid}
              />
            </div>
          </section>

          {/* Subject-wise answers a different question — not "which exam was
              this in" but "what does this chapter cover". It gets its own
              section because that is genuinely the other way round. */}
          {subjectTotal > 0 && (
            <section className="space-y-3 pt-2">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-foreground sm:text-base">
                  বিষয় ও টপিকভিত্তিক প্রশ্ন
                </h2>
                <p className="text-xs text-muted-foreground">
                  একটি অধ্যায়ের বিভিন্ন পরীক্ষার প্রশ্ন একসঙ্গে অনুশীলন করো।
                </p>
              </div>

              <div className="max-w-xl">
                <QbCard
                  href="/qb/subjects"
                  title="বিষয় অনুযায়ী সব প্রশ্ন"
                  subtitle={`${toBengaliDigits(subjects.length)} টি বিষয় · অধ্যায় ও টপিক অনুযায়ী`}
                  questions={subjectTotal}
                  variant="row"
                />
              </div>

              {subjects.slice(0, 6).map((subject) => (
                <div key={subject.id} className="max-w-xl">
                  <QbCard
                    href={`/qb/subjects/${subject.slug}`}
                    title={subject.name}
                    subtitle="অধ্যায় ও টপিক অনুযায়ী"
                    questions={subject.questions}
                    variant="row"
                  />
                </div>
              ))}
            </section>
          )}

          <section className="space-y-3 border-t border-border pt-5">
            <div className="max-w-xl">
              <QbCard
                href="/qb/practice"
                title="প্র্যাকটিস মোড"
                subtitle="বিষয় বেছে নিয়ে একটির পর একটি প্রশ্নের উত্তর দাও"
                questions={counts.total}
                variant="row"
              />
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            প্রতিটি প্রশ্ন একবারই সংরক্ষিত। যে পরীক্ষাগুলোতে সেটি এসেছে, সবগুলোই একই
            প্রশ্নের নিচে দেখানো হয় — তাই একই প্রশ্ন কখনো দুবার দেখা যায় না।
          </p>
        </>
      )}
    </div>
  );
}
