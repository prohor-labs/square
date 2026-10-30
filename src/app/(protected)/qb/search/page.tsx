import Link from "next/link";
import type { ReactElement } from "react";
import { Search } from "@/components/icons";
import { QbBreadcrumbs } from "@/components/qb/student/qb-breadcrumbs";
import { QbEmpty } from "@/components/qb/student/qb-empty";
import { QbHighlight } from "@/components/qb/student/qb-highlight";
import { QbQuestionCard } from "@/components/qb/student/qb-question-card";
import { QbSearchBox } from "@/components/qb/student/qb-search-box";
import { QbSectionHeading } from "@/components/qb/student/qb-section-heading";
import { QbShell } from "@/components/qb/student/qb-shell";
import { toBengaliDigits } from "@/lib/calendar-date";
import { searchQb } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

const SEARCH_LIMIT = 80;

/** Full search results: matching shelves first, then the questions themselves. */
export default async function QbSearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const query = await searchParams;
  const raw = Array.isArray(query.q) ? query.q[0] : query.q;
  const term = (raw ?? "").trim();

  const result = term
    ? await searchQb(term, SEARCH_LIMIT)
    : { term: "", questions: [], nodes: [], totalQuestions: 0 };

  return (
    <QbShell>
      <div className="flex flex-col gap-5">
        <QbBreadcrumbs
          items={[
            { label: "প্রশ্নব্যাংক", href: "/qb" },
            { label: term ? `সার্চ: ${term}` : "সার্চ" },
          ]}
        />

        <QbSectionHeading
          icon={<Search className="size-5" aria-hidden="true" />}
          eyebrow="সার্চ"
          title={term ? `“${term}”` : "প্রশ্ন খুঁজুন"}
          description={
            term
              ? `${toBengaliDigits(result.totalQuestions)}টি প্রশ্নে মিল পাওয়া গেছে।`
              : "বিষয়, বিশ্ববিদ্যালয়, সাল, অধ্যায়, প্রশ্ন বা উত্তরের শব্দ লিখুন।"
          }
        />

        <div className="max-w-3xl">
          <QbSearchBox initialTerm={term} />
        </div>

        {term.length === 0 ? (
          <QbEmpty
            title="সার্চ শুরু করুন"
            body="উপরের বাক্সে বাংলা বা ইংরেজিতে লিখুন — যেমন “ঢাবি”, “2024”, “যোগজীকরণ” বা “ভেক্টর”।"
          />
        ) : result.questions.length === 0 && result.nodes.length === 0 ? (
          <QbEmpty
            title="কিছু পাওয়া যায়নি"
            body="শব্দটা ছোট করে বা অন্য বানানে চেষ্টা করুন। প্রতিষ্ঠানের সংক্ষিপ্ত নামও কাজ করে (যেমন ঢাবি, বুয়েট)।"
            action={
              <Link
                href="/qb"
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90"
              >
                প্রশ্নব্যাংকে ফিরুন
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-7">
            {result.nodes.length > 0 ? (
              <section aria-labelledby="search-shelves">
                <h2
                  id="search-shelves"
                  className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground"
                >
                  বিভাগ
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {result.nodes.map((node) => (
                    <li key={`${node.href}-${node.label}`}>
                      <Link
                        href={node.href}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">
                            <QbHighlight text={node.label} term={term} />
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {node.hint}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                          {toBengaliDigits(node.count)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.questions.length > 0 ? (
              <section aria-labelledby="search-questions">
                <h2
                  id="search-questions"
                  className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground"
                >
                  প্রশ্ন
                </h2>
                <ol className="flex flex-col gap-5">
                  {result.questions.map((question, index) => (
                    <QbQuestionCard
                      key={question.id}
                      question={question}
                      index={index + 1}
                    />
                  ))}
                </ol>
                {result.totalQuestions > result.questions.length ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    আরও{" "}
                    {toBengaliDigits(
                      result.totalQuestions - result.questions.length,
                    )}
                    টি ফলাফল আছে — শব্দটা আরও নির্দিষ্ট করুন।
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </QbShell>
  );
}
