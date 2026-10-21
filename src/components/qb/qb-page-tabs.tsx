"use client";

import type { ReactElement } from "react";
import { Clipboard, Upload } from "@/components/icons";
import {
  QbQuestionBrowser,
  type QbQuestionBrowserProps,
} from "@/components/qb/qb-question-browser";
import { QbUploader } from "@/components/qb/qb-uploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QbFileSummary } from "@/lib/actions/qb-uploads";

/**
 * /qb is split into two tabs so the upload form does not push the whole bank
 * down the page. The question panel stays mounted while the upload tab is open,
 * which keeps its filters and already-rendered cards alive.
 */
export function QbPageTabs({
  files,
  ...props
}: QbQuestionBrowserProps & {
  readonly files: readonly QbFileSummary[];
}): ReactElement {
  return (
    <Tabs defaultValue="questions" className="w-full gap-4">
      <TabsList variant="pill" className="w-full justify-start sm:w-fit">
        <TabsTrigger value="questions" className="gap-2">
          <Clipboard className="size-4 shrink-0" />
          <span>সব প্রশ্ন</span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-black text-primary">
            {props.allTotal}
          </span>
        </TabsTrigger>
        <TabsTrigger value="upload" className="gap-2">
          <Upload className="size-4 shrink-0" />
          <span>প্রশ্ন আপলোড</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="questions"
        keepMounted
        className="focus-visible:outline-none"
      >
        <QbQuestionBrowser {...props} />
      </TabsContent>

      <TabsContent
        value="upload"
        keepMounted
        className="focus-visible:outline-none"
      >
        <QbUploader files={files} />
      </TabsContent>
    </Tabs>
  );
}
