import { notFound } from "next/navigation";
import { AdminItemsManager } from "@/components/admin/admin-items-manager";
import { getQbTree } from "@/lib/actions/qb-nav";

export const dynamic = "force-dynamic";

/** Level 2 — the units inside one container. */
export default async function AdminQbUnitsPage({
  params,
}: {
  readonly params: Promise<{ containerSlug: string }>;
}) {
  const { containerSlug } = await params;
  const qb = (await getQbTree()).find((node) => node.slug === containerSlug);

  if (!qb) notFound();

  return <AdminItemsManager qb={qb} initialUnits={qb.units} />;
}
