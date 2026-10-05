import { headers } from "next/headers";
import type { ReactElement } from "react";
import { EnrolledCourses } from "@/components/profile/EnrolledCourses";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { getStudentEnrolledCourses } from "@/lib/actions/student-profile";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const courses = userId ? await getStudentEnrolledCourses(userId) : [];

  return (
    <div className="w-full bg-background pb-12 lg:pb-0">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full">
            <div className="w-full flex flex-col gap-5 md:gap-6 lg:gap-8">
              {/* Name + enrolled courses */}
              <div className="w-full flex flex-col gap-4 md:gap-5">
                <ProfileSidebar />
                <EnrolledCourses courses={courses} />
              </div>

              {/* Settings menu, unchanged */}
              <div className="w-full">
                <ProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
