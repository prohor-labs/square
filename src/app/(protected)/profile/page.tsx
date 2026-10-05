import { headers } from "next/headers";
import type { ReactElement } from "react";
import { EnrolledCourses } from "@/components/profile/EnrolledCourses";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SchoolCollegeCard } from "@/components/profile/SchoolCollegeCard";
import {
  getStudentEnrolledCourses,
  getStudentIdentity,
} from "@/lib/actions/student-profile";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";

  const [courses, identity] = userId
    ? await Promise.all([
        getStudentEnrolledCourses(userId),
        getStudentIdentity(userId),
      ])
    : [[], { school: null, college: null }];

  return (
    <div className="w-full bg-background pb-12 lg:pb-0">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full flex flex-col gap-5 md:gap-6 lg:gap-8">
            {/* Name, email, id */}
            <ProfileSidebar userId={userId} />

            {/* School / college, editable by the student */}
            <SchoolCollegeCard
              school={identity.school}
              college={identity.college}
            />

            {/* Enrolled courses in a 2x2 grid */}
            <EnrolledCourses courses={courses} />

            {/* The only account action kept here */}
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
