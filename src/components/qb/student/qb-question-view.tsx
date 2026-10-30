import Link from "next/link";
import type { ReactElement } from "react";
import { AngleLeft, AngleRight, ArrowLeft2 } from "@/components/icons";
import { QbBreadcrumbs } from "@/components/qb/student/qb-breadcrumbs";
import { QbQuestionCard } from "@/components/qb/student/qb-question-card";
import { toBengaliDigits } from "@/lib/calendar-date";
import type { QbQuestionContext } from "@/lib/qb-catalog";

/**
 * One question on its own page.
 *
 * The prev/next links keep the file the student came from, so moving forward
 * follows the CSV order instead of jumping to an unrelated question.
 */
export function QbQuestionView({
  context,
}: {
  readonly context: QbQuestionContext;
}): ReactElement {
  const { question, position, prevId, nextId, contextSetId } = context;

  const questionHref = (id: string): string =>
    `/qb/question/${id}${
      contextSetId ? `?set=${encodeURIComponent(contextSetId)}` : ""
    }`;

  const facts = [
    question.subjectName
      ? { label: "বিষয়", value: question.subjectName }
      : null,
    question.paperName ? { label: "পত্র", value: question.paperName } : null,
    question.chapterName
      ? { label: "অধ্যায়", value: question.chapterName }
      : null,
    question.topicName ? { label: "টপিক", value: question.topicName } : null,
    question.shelves[0]?.university
      ? { label: "প্রতিষ্ঠান", value: question.shelves[0].university }
      : null,
    question.shelves[0]?.unit
      ? { label: "ইউনিট", value: question.shelves[0].unit }
      : null,
    question.shelves[0]?.year
      ? { label: "সাল", value: toBengaliDigits(question.shelves[0].year) }
      : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <div className="flex flex-col gap-5">
      <QbBreadcrumbs items={context.crumbs} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={context.backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ArrowLeft2 className="size-3.5" aria-hidden="true" />
          ফিরে যান
        </Link>

        {position.total > 0 ? (
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold text-muted-foreground">
            প্রশ্ন {toBengaliDigits(position.index + 1)} /{" "}
            {toBengaliDigits(position.total)}
          </span>
        ) : null}
      </div>

      <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
        {facts.length > 0 ? (
          <dl className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-lg bg-muted/60 px-2.5 py-1.5"
              >
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {fact.label}
                </dt>
                <dd className="text-xs font-bold text-foreground/90">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <ol className="flex flex-col gap-4">
          <QbQuestionCard
            question={question}
            index={position.index + 1}
            showPermalink={false}
          />
        </ol>
      </section>

      <nav
        aria-label="প্রশ্ন পরিবর্তন"
        className="flex items-stretch gap-2 sm:gap-3"
      >
        <NeighbourLink
          href={prevId ? questionHref(prevId) : null}
          direction="prev"
        />
        <NeighbourLink
          href={nextId ? questionHref(nextId) : null}
          direction="next"
        />
      </nav>
    </div>
  );
}

function NeighbourLink({
  href,
  direction,
}: {
  readonly href: string | null;
  readonly direction: "prev" | "next";
}): ReactElement {
  const isNext = direction === "next";
  const label = isNext ? "পরের প্রশ্ন" : "আগের প্রশ্ন";

  const body = (
    <>
      {isNext ? null : (
        <AngleLeft className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span className="text-xs font-bold">{label}</span>
      {isNext ? (
        <AngleRight className="size-4 shrink-0" aria-hidden="true" />
      ) : null}
    </>
  );

  const base =
    "flex flex-1 items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 transition-colors";

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-border/60 text-muted-foreground/40`}
      >
        {body}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} border-border bg-card text-foreground hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`}
    >
      {body}
    </Link>
  );
}
