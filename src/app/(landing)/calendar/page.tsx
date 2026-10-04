import { headers } from "next/headers";
import { CalendarView } from "@/components/calendar/calendar-view";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import Shell from "@/components/shell";
import { getCalendarCategoryContent } from "@/lib/actions/settings";
import { auth } from "@/lib/auth";
import { dictionary } from "@/lib/dictionary";

// Public route: admission dates are useful to visitors who have no account, so
// there is no redirect here — logged-in users still get the app sidebar.
export default async function CalendarPage() {
  const [session, content] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getCalendarCategoryContent(),
  ]);

  if (session?.user) {
    return (
      <Shell dict={dictionary} lang="en">
        <div className="flex flex-col min-h-screen pb-20 max-w-5xl mx-auto w-full pt-2 md:pt-6 gap-6 font-sans">
          <CalendarView content={content} />
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <CalendarView content={content} />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
