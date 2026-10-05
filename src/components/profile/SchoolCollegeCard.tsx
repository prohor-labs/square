"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { updateStudentIdentity } from "@/lib/actions/student-profile";

interface SchoolCollegeCardProps {
  readonly school: string | null;
  readonly college: string | null;
}

export function SchoolCollegeCard({ school, college }: SchoolCollegeCardProps) {
  const [editing, setEditing] = useState(false);
  const [schoolValue, setSchoolValue] = useState(school ?? "");
  const [collegeValue, setCollegeValue] = useState(college ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEditing() {
    setSchoolValue(school ?? "");
    setCollegeValue(college ?? "");
    setError(null);
    setEditing(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateStudentIdentity({
        school: schoolValue,
        college: collegeValue,
      });
      if (res.success) {
        setEditing(false);
      } else {
        setError(res.error ?? "সেভ করা যায়নি");
      }
    });
  }

  return (
    <section className="w-full border border-border/70 rounded-2xl bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4">
        <h2 className="font-bold text-base sm:text-lg">স্কুল ও কলেজ</h2>
        {!editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startEditing}
            className="rounded-xl h-9 px-3 text-xs font-semibold border-border/70"
          >
            সম্পাদনা
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="school" className="text-xs font-semibold">
                স্কুলের নাম
              </Label>
              <Input
                id="school"
                value={schoolValue}
                onChange={(e) => setSchoolValue(e.target.value)}
                placeholder="e.g. ঢাকা কলেজিয়েট স্কুল"
                maxLength={120}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college" className="text-xs font-semibold">
                কলেজের নাম
              </Label>
              <Input
                id="college"
                value={collegeValue}
                onChange={(e) => setCollegeValue(e.target.value)}
                placeholder="e.g. কারমাইকেল কলেজ, রংপুর"
                maxLength={120}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={pending}
              className="rounded-xl h-9 px-4 text-xs font-semibold"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="rounded-xl h-9 px-4 text-xs font-semibold"
            >
              {pending ? <Spinner className="size-3.5" /> : "সেভ করুন"}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-[11px] font-semibold text-muted-foreground">
              স্কুলের নাম
            </dt>
            <dd className="mt-1 text-sm sm:text-[15px] font-semibold break-words">
              {school || <span className="text-muted-foreground/60">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-muted-foreground">
              কলেজের নাম
            </dt>
            <dd className="mt-1 text-sm sm:text-[15px] font-semibold break-words">
              {college || <span className="text-muted-foreground/60">—</span>}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
