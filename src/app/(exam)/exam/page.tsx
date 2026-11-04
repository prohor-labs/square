import type { Metadata } from "next";
import type { ReactElement } from "react";
import {
  CustomExamFlow,
  type ExamAdCourse,
} from "@/components/custom-exam/custom-exam-flow";
import { getCourses } from "@/lib/actions/course";
import { getQbExamOptions } from "@/lib/qb-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "কাস্টম এক্সাম — প্রশ্নব্যাংক থেকে নিজের পরীক্ষা",
  description:
    "বিশ্ববিদ্যালয়, ইঞ্জিনিয়ারিং বা মেডিকেল প্রশ্নব্যাংক থেকে নিজের পছন্দমতো প্রশ্ন বেছে সময় ও নেগেটিভ মার্কিং সেট করে পরীক্ষা দিন — লগইন ছাড়াই।",
};

/** Custom exam: pick from the question bank, sit the paper, see the score. */
export default async function CustomExamPage(): Promise<ReactElement> {
  const [options, admissionCourses] = await Promise.all([
    getQbExamOptions(),
    getCourses("Admission"),
  ]);

  const ads: readonly ExamAdCourse[] = admissionCourses.map((course) => ({
    id: course.id,
    slug: course.slug,
    name: course.name,
    image: course.image,
    price: course.price,
    originalPrice: course.originalPrice ?? null,
    badge: course.badge ?? null,
    features: course.features.slice(0, 2).map((feature) => feature.label),
  }));

  return <CustomExamFlow options={options} ads={ads} />;
}
