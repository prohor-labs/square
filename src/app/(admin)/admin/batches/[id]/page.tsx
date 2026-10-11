import { notFound } from "next/navigation";
import { BatchDetailView } from "@/components/admin/batch-detail-view";
import { getBatchDetailAction, getBatchesAction } from "@/lib/actions/batch";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ success, data }, batches] = await Promise.all([
    getBatchDetailAction(id),
    getBatchesAction(),
  ]);

  if (!success || !data) {
    return notFound();
  }

  // The archive tab lets an admin file an exam under any course, not just this one.
  const courses = (batches.data ?? []).map((batch) => ({
    id: batch.id,
    name: batch.name,
  }));

  return <BatchDetailView batch={data} courses={courses} />;
}
