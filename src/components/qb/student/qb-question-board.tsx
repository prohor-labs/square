import Link from "next/link";
import { QbPagination } from "@/components/qb/student/qb-pagination";
import { QbQuestionCard } from "@/components/qb/student/qb-question-card";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { QbQuestionsPage } from "@/lib/qb-catalog";
import { cn } from "@/lib/utils";

/**
 * The question list and its subject tabs.
 *
 * Subject tabs are plain links (`?subject=…`), so they filter the whole node on
 * the server — pagination, counts and the "মোট" line always agree. Answers are
 * always visible; there is no reveal switch.
 */
export function QbQuestionBoard({
  data,
  pageSize,
}: {
  readonly data: QbQuestionsPage;
  readonly pageSize: number;
}): React.ReactElement {
  const offset = (data.page - 1) * pageSize;
  const subjectQuery = data.activeSubject
    ? `subject=${encodeURIComponent(data.activeSubject)}`
    : "";
  const tabHref = (subject: string): string =>
    subject
      ? `${data.basePath}?subject=${encodeURIComponent(subject)}`
      : data.basePath;

  const allCount = data.subjects.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col gap-3">
      {data.subjects.length > 1 ? (
        <div
          role="tablist"
          aria-label="বিষয় অনুযায়ী প্রশ্ন"
          className="flex flex-wrap gap-1.5"
        >
          <SubjectTab
            href={tabHref("")}
            label="সব বিষয়"
            count={allCount}
            selected={data.activeSubject.length === 0}
          />
          {data.subjects.map((subject) => (
            <SubjectTab
              key={subject.label}
              href={tabHref(subject.label)}
              label={subject.label}
              count={subject.count}
              selected={data.activeSubject === subject.label}
            />
          ))}
        </div>
      ) : null}

      {data.questions.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/30 px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
          এই বিষয়ে এই অংশে কোনো প্রশ্ন নেই।
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold text-muted-foreground">
            মোট {toBengaliDigits(data.total)}টি প্রশ্নের মধ্যে{" "}
            {toBengaliDigits(offset + 1)}–
            {toBengaliDigits(
              Math.min(offset + data.questions.length, data.total),
            )}
            টি দেখানো হচ্ছে
          </p>

          <ol className="flex flex-col gap-5">
            {data.questions.map((question, index) => (
              <QbQuestionCard
                key={question.id}
                question={question}
                index={offset + index + 1}
              />
            ))}
          </ol>
        </>
      )}

      <QbPagination
        basePath={data.basePath}
        page={data.page}
        pageCount={data.pageCount}
        query={subjectQuery}
      />
    </div>
  );
}

function SubjectTab({
  href,
  label,
  count,
  selected,
}: {
  readonly href: string;
  readonly label: string;
  readonly count: number;
  readonly selected: boolean;
}): React.ReactElement {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={selected}
      scroll={false}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:text-xs",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
          selected
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {toBengaliDigits(count)}
      </span>
    </Link>
  );
}
