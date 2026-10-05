import { ArrowRight2, BookOpen } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { EnrolledCourse } from "@/lib/actions/student-profile";

interface EnrolledCoursesProps {
  readonly courses: readonly EnrolledCourse[];
}

export function EnrolledCourses({ courses }: EnrolledCoursesProps) {
  return (
    <section className="w-full border border-border/70 rounded-2xl bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4">
        <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
          <BookOpen className="size-4 sm:size-5 text-primary" />
          আমার কোর্স
        </h2>
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
          {courses.length} টি
        </span>
      </div>

      {courses.length === 0 ? (
        <p className="py-6 text-center text-xs sm:text-sm text-muted-foreground">
          এখনো কোনো কোর্সে ভর্তি হয়নি।
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {courses.map((course) => (
            <li key={course.id}>
              <Button
                variant="outline"
                render={<a href={`/my-courses/${course.id}`} />}
                className="w-full h-auto justify-start gap-3 rounded-xl border-border/70 px-3.5 py-3 text-left hover:border-primary/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-sm sm:text-[15px] leading-snug truncate">
                    {course.name}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {course.hscBatch}
                    </span>
                    {course.badge && (
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {course.badge}
                      </span>
                    )}
                  </span>
                </span>
                <ArrowRight2 className="size-4 shrink-0 text-muted-foreground/50" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
