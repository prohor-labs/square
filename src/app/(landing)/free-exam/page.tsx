import type { ReactElement } from "react";
import { Flash } from "@/components/icons";
import { LandingFooter, LandingHeader } from "@/components/landing-nav";
import { FreeExamsClientView } from "@/components/free-exam/free-exams-client-view";
import { getPublicFreeExamsListAction } from "@/lib/actions/free-exam";


export default async function FreeExamsPortalPage(): Promise<ReactElement> {
  const { data: examsList = [] } = await getPublicFreeExamsListAction();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full flex flex-col gap-6">
        {/* Simple Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Flash className="size-5 text-primary" />
              <span>ফ্রি এক্সাম</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              যেকোনো পরীক্ষায় ক্লিক করে সরাসরি অংশ নিন
            </p>
          </div>
          {examsList.length > 0 && (
            <span className="text-xs font-semibold px-3 py-1 bg-muted rounded-xl text-muted-foreground self-start sm:self-auto border border-border/60">
              মোট পরীক্ষা: {examsList.length}টি
            </span>
          )}
        </div>

        {/* Client View with Tabs & Filtered Grid */}
        <FreeExamsClientView examsList={examsList} />
      </main>

      <LandingFooter />
    </div>
  );
}
