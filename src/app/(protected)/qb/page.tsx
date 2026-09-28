import { headers } from "next/headers";
import type { ReactElement } from "react";
import { QbClientView } from "@/components/qb/qb-client-view";
import { getUserQbContainers } from "@/lib/actions/qb-access";
import { auth } from "@/lib/auth";

export default async function QuestionBankPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const qbs = await getUserQbContainers(userId);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-16 sm:pb-24 pt-0 gap-6 font-sans">
      <QbClientView containers={qbs || []} />
    </div>
  );
}

