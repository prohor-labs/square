"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CourseOption {
  readonly batchId: string;
  readonly title: string;
  readonly count: number;
}

/**
 * Course picker shared by the live and past class pages. The choice lives in
 * the URL so the view survives a refresh and can be linked to.
 */
export function CoursePicker({
  courses,
  value,
  allLabel,
}: {
  readonly courses: readonly CourseOption[];
  readonly value: string;
  readonly allLabel: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const select = (next: string) => {
    const query = new URLSearchParams(params.toString());
    if (next === "all") query.delete("course");
    else query.set("course", next);
    const search = query.toString();
    router.push(search ? `?${search}` : "?", { scroll: false });
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">কোর্স</span>
      <Select value={value} onValueChange={select}>
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue placeholder="কোর্স নির্বাচন করুন" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.batchId} value={course.batchId}>
              {course.title} ({course.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
