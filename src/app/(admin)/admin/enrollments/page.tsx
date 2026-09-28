import { desc, eq } from "drizzle-orm";
import { EnrollmentRequestsList } from "@/components/admin/enrollment-requests-list";
import { db } from "@/db";
import { batchEnrollmentRequests, batches, user } from "@/db/schema";


export default async function AdminEnrollmentsPage() {
  const requests = await db
    .select({
      request: batchEnrollmentRequests,
      user: {
        name: user.name,
        email: user.email,
      },
      course: {
        title: batches.name,
        hscBatch: batches.hscBatch,
      },
    })
    .from(batchEnrollmentRequests)
    .leftJoin(user, eq(batchEnrollmentRequests.userId, user.id))
    .leftJoin(batches, eq(batchEnrollmentRequests.batchId, batches.id))
    .orderBy(desc(batchEnrollmentRequests.createdAt));

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          পেমেন্ট ও এনরোলমেন্ট
        </h1>
      </div>

      <EnrollmentRequestsList requests={requests} />
    </div>
  );
}
