import type { ReactElement, ReactNode } from "react";
import { QbBreadcrumbs } from "@/components/qb/student/qb-breadcrumbs";
import { QbEmpty } from "@/components/qb/student/qb-empty";
import { QbNodeGrid } from "@/components/qb/student/qb-node-grid";
import { QbQuestionList } from "@/components/qb/student/qb-question-list";
import { QbSectionHeading } from "@/components/qb/student/qb-section-heading";
import type { QbPageData } from "@/lib/qb-catalog";

/** The body of every drill-down page: trail, heading, then cards or questions. */
export function QbPageView({
  data,
  icon,
  eyebrow,
}: {
  readonly data: QbPageData;
  readonly icon: ReactNode;
  readonly eyebrow?: string;
}): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <QbBreadcrumbs items={data.crumbs} />

      <QbSectionHeading
        icon={icon}
        eyebrow={eyebrow}
        title={data.title}
        description={data.description}
        count={data.kind === "questions" ? data.total : undefined}
      />

      {data.kind === "questions" ? (
        <QbQuestionList data={data} />
      ) : data.nodes.length > 0 ? (
        <QbNodeGrid nodes={data.nodes} />
      ) : (
        <QbEmpty title={data.emptyTitle} body={data.emptyBody} />
      )}
    </div>
  );
}
