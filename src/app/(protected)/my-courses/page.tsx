import { headers } from "next/headers";
import { MyCoursesClientView } from "@/components/courses/my-courses-client-view";
import { getCourses, getMyCourses } from "@/lib/actions/course";
import { auth } from "@/lib/auth";

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab } = (await searchParams) || {};
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [enrolledRes, allCoursesRes] = await Promise.all([
    userId ? getMyCourses(userId) : Promise.resolve([]),
    getCourses(),
  ]);

  const enrolledCourses = Array.isArray(enrolledRes) ? enrolledRes : [];
  const allCourses = Array.isArray(allCoursesRes) ? allCoursesRes : [];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-16 sm:pb-24 pt-0 gap-6 font-sans">
      <MyCoursesClientView
        enrolledCourses={enrolledCourses}
        allCourses={allCourses}
        defaultTab={tab}
      />
    </div>
  );
}

