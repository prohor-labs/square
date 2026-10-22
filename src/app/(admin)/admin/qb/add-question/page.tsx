import type { ReactElement } from "react";
import { QbUploadPage } from "@/components/qb/qb-upload-page";

export const dynamic = "force-dynamic";

/** The question add screen: browse every question or upload new ones. */
export default async function AdminAddQuestionPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  return <QbUploadPage searchParams={searchParams} />;
}
