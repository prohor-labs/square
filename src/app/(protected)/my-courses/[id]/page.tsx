import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CourseClassroomView } from "@/components/classroom/course-classroom-view";
import { db } from "@/db";
import { batchDetails, batches } from "@/db/schema";
import { getUserCourseById } from "@/lib/actions/course";
import { getBatchClassroomData } from "@/lib/actions/course-content";
import { auth } from "@/lib/auth";


interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MyCourseClassroomPage({
  params,
}: CourseDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/login?callbackUrl=/my-courses/${id}`);
  }

  let actualBatchId = id;
  let [userBatch, classroomData] = await Promise.all([
    getUserCourseById(userId, actualBatchId),
    getBatchClassroomData(actualBatchId),
  ]);

  // Backward compatibility: If id was batch_details.id or slug instead of batch.id
  if (!classroomData.batch && !userBatch) {
    const detail = await db.query.batchDetails.findFirst({
      where: eq(batchDetails.id, id),
    });
    if (detail?.batchId) {
      actualBatchId = detail.batchId;
      [userBatch, classroomData] = await Promise.all([
        getUserCourseById(userId, actualBatchId),
        getBatchClassroomData(actualBatchId),
      ]);
    } else {
      const batchBySlug = await db.query.batches.findFirst({
        where: eq(batches.slug, id),
      });
      if (batchBySlug?.id) {
        actualBatchId = batchBySlug.id;
        [userBatch, classroomData] = await Promise.all([
          getUserCourseById(userId, actualBatchId),
          getBatchClassroomData(actualBatchId),
        ]);
      }
    }
  }

  if (!classroomData.batch && !userBatch) {
    notFound();
  }

  const batch = userBatch || classroomData.batch;

  return (
    <CourseClassroomView
      batch={batch}
      classes={classroomData.classes}
      pdfs={classroomData.pdfs}
      exams={classroomData.exams}
    />
  );
}
