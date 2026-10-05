import { AdminContainersManager } from "@/components/admin/admin-containers-manager";
import { db } from "@/db";
import { getQbTree } from "@/lib/actions/qb-nav";

export const dynamic = "force-dynamic";

export default async function AdminQbBanksPage() {
  /* The counts come from getQbTree — questions hang off subitems, so counting
     them here would mean pulling every question row in. The container rows
     themselves are read separately so the edit dialog still has the
     description to prefill. */
  const [rows, tree] = await Promise.all([
    db.query.containers.findMany({
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    }),
    getQbTree(),
  ]);

  const counts = new Map(tree.map((node) => [node.id, node]));

  const qbs = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    units: counts.get(row.id)?.units.length ?? 0,
    questions: counts.get(row.id)?.questions ?? 0,
  }));

  return <AdminContainersManager initialQbs={qbs} />;
}
