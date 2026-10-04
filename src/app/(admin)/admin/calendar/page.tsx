"use client";

import { AdminCalendarContentEditor } from "@/components/admin/admin-calendar-content-editor";
import { Calendar } from "@/components/icons";

export default function AdminCalendarPage() {
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 pt-2 md:py-8 gap-6">
      <div className="flex flex-col">
        <h1 className="font-bold text-2xl sm:text-3xl flex items-center gap-2">
          <Calendar className="size-7 text-primary" />
          ক্যালেন্ডার ম্যানেজমেন্ট
        </h1>
        <p className="text-sm text-muted-foreground">
          প্রতিটি ক্যাটাগরির থাম্বনেল ও তারিখ সারণি যোগ বা সম্পাদনা করুন।
        </p>
      </div>

      <AdminCalendarContentEditor />
    </div>
  );
}
