import type { ReactElement } from "react";
import { QbBankPage } from "@/components/qb/qb-bank-page";

export const dynamic = "force-dynamic";

/** The question bank screen — see `QbBankPage` for the shared behaviour. */
export default async function QbPage(): Promise<ReactElement> {
  return <QbBankPage />;
}
