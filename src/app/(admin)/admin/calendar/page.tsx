import { AdminApplicationEditor } from "@/components/admin/admin-application-editor";
import { AdminCalendarContentEditor } from "@/components/admin/admin-calendar-content-editor";
import { Calendar } from "@/components/icons";

export default function AdminCalendarPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pt-2 pb-12 md:py-8">
      <div className="flex flex-col">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Calendar className="size-7 text-primary" />
          ক্যালেন্ডার ম্যানেজমেন্ট
        </h1>
        <p className="text-sm text-muted-foreground">
          ভর্তি পরীক্ষার সময়সূচি ও আবেদনের তথ্য যোগ বা সম্পাদনা করুন।
        </p>
      </div>

      <AdminCalendarContentEditor />
      <AdminApplicationEditor />
    </div>
  );
}
