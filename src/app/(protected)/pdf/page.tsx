"use client";

import { Warning } from "@/components/icons";
import { PdfSuggestionView } from "@/components/pdf/pdf-suggestion-view";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function PDFSuggestionsPage() {
  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-7xl mx-auto w-full pt-0 gap-6 font-sans">
      <PdfSuggestionView />
    </div>
  );
}
