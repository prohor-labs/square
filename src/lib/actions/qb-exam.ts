"use server";

import {
  getQbExamSubjectOptions,
  type QbExamSubjectOption,
} from "@/lib/qb-catalog";
import { buildCustomExam } from "@/lib/qb-exam";
import type { CustomExam, CustomExamRequest } from "@/lib/qb-exam-types";

/**
 * Subjects / chapters / topics available inside one section, group and year.
 *
 * Kept here rather than in `qb-catalog` so the exam form can refresh its
 * subject tree without shipping the whole catalog to the browser.
 */
export async function getQbExamSubjectsAction(filters: {
  section?: string;
  group?: string;
  year?: string;
}): Promise<readonly QbExamSubjectOption[]> {
  try {
    return await getQbExamSubjectOptions({
      section: filters.section,
      group: filters.group,
      year: filters.year,
    });
  } catch {
    return [];
  }
}

/**
 * Starts a custom exam.
 *
 * Anyone can call this — there is no session and nothing is written anywhere.
 * The paper exists only in the caller's browser.
 */
export type StartCustomExamResult =
  | { readonly ok: true; readonly exam: CustomExam }
  | { readonly ok: false; readonly error: string };

export async function startCustomExamAction(
  request: CustomExamRequest,
): Promise<StartCustomExamResult> {
  try {
    const exam = await buildCustomExam(request);
    if (!exam) {
      return {
        ok: false,
        error:
          "এই ফিল্টারে এখনো কোনো MCQ প্রশ্ন নেই। অন্য বিভাগ, সাল বা বিষয় বেছে দেখুন।",
      };
    }
    return { ok: true, exam };
  } catch {
    return {
      ok: false,
      error: "পরীক্ষাটি তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন।",
    };
  }
}
