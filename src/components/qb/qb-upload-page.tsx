import type { ReactElement } from "react";
import { QbPageTabs } from "@/components/qb/qb-page-tabs";
import {
  getQbBrowserData,
  getQbFileSummaries,
  getQbUploadsData,
} from "@/lib/qb-bank";

/** Below this size every card is kept mounted for instant client filtering. */
const CLIENT_FILTER_LIMIT = 120;

/**
 * How many questions one screen of the admin list carries.
 *
 * A bank of several thousand rows used to be rendered in full, which blocked
 * the page for ~30 seconds — long enough that the upload form stopped
 * responding. The list now starts small and `?show=N` grows it one screen at a
 * time; the filter bar narrows it when a specific question is needed.
 */
const ADMIN_PAGE_SIZE = 100;
const ADMIN_MAX_PAGES = 5;

/** A query param can arrive twice (`?subject=a&subject=b`); take the first. */
function readParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

export interface QbUploadPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The tabbed question bank screen behind `/admin/qb/add-question`: one tab
 * lists every uploaded question with the subject/chapter/topic filters, the
 * other holds the upload form. The question panel stays mounted while the
 * upload tab is open so its filters survive the switch.
 */
export async function QbUploadPage({
  searchParams,
}: QbUploadPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const filters = {
    subjectId: readParam(params.subject),
    chapterId: readParam(params.chapter),
    topicId: readParam(params.topic),
  };

  const requested = Number(readParam(params.show) ?? "1");
  const pages = Number.isFinite(requested)
    ? Math.min(Math.max(1, Math.trunc(requested)), ADMIN_MAX_PAGES)
    : 1;

  const [browser, files] = await Promise.all([
    getQbBrowserData(filters),
    getQbFileSummaries(),
  ]);
  const clientFilter = browser.allTotal <= CLIENT_FILTER_LIMIT;
  const page = clientFilter
    ? null
    : await getQbUploadsData(filters, pages * ADMIN_PAGE_SIZE);

  const showMoreParams = new URLSearchParams();
  if (filters.subjectId) showMoreParams.set("subject", filters.subjectId);
  if (filters.chapterId) showMoreParams.set("chapter", filters.chapterId);
  if (filters.topicId) showMoreParams.set("topic", filters.topicId);
  showMoreParams.set("show", String(pages + 1));
  const showMoreHref =
    pages < ADMIN_MAX_PAGES
      ? `/admin/qb/add-question?${showMoreParams.toString()}`
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-16 pt-2 md:py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          প্রশ্নব্যাংক
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          নিচের ট্যাব থেকে প্রশ্ন আপলোড করুন অথবা সব প্রশ্ন দেখুন।
        </p>
      </header>

      <QbPageTabs
        questions={clientFilter ? browser.questions : (page?.questions ?? [])}
        filterTree={browser.filterTree}
        selected={browser.selected}
        allTotal={browser.allTotal}
        total={clientFilter ? browser.allTotal : (page?.total ?? 0)}
        clientFilter={clientFilter}
        showMoreHref={showMoreHref}
        files={files}
      />
    </div>
  );
}
