import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight2,
  Download,
  Export,
  FileDown,
  FileText,
  Flash,
  Lock,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CustomTabBar } from "@/components/shared/custom-tab-bar";
import { getPdfSuggestions } from "@/lib/actions/pdf";
import {
  formatGoogleDriveDownloadUrl,
  formatGoogleDriveUrl,
} from "@/lib/drive";
import { PdfEmbedViewer } from "@/components/pdf/pdf-embed-viewer";
import type { PdfSuggestion } from "@/types";

export function PdfSuggestionView() {
  const [subject, setSubject] = useState("all");
  const [paper, setPaper] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: pdfList = [], isLoading: isFetchingPdfs } = useQuery<
    PdfSuggestion[]
  >({
    queryKey: ["pdf-suggestions"],
    queryFn: () => getPdfSuggestions(),
  });

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit
    );
  };

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: pdfList.length,
      physics: 0,
      chemistry: 0,
      "higher-math": 0,
      biology: 0,
      ict: 0,
    };
    pdfList.forEach((item) => {
      const s = (item.subject || "").toLowerCase();
      if (s.includes("phys") || s.includes("পদার্থ")) counts.physics++;
      else if (s.includes("chem") || s.includes("রসায়ন") || s.includes("রসায়ন")) counts.chemistry++;
      else if (s.includes("math") || s.includes("গণিত")) counts["higher-math"]++;
      else if (s.includes("bio") || s.includes("জীব")) counts.biology++;
      else if (s.includes("ict") || s.includes("তথ্য")) counts.ict++;
    });
    return counts;
  }, [pdfList]);

  const tabs = [
    { id: "all", label: "সকল বিষয়", count: subjectCounts.all },
    { id: "physics", label: "পদার্থবিজ্ঞান", count: subjectCounts.physics },
    { id: "chemistry", label: "রসায়ন", count: subjectCounts.chemistry },
    { id: "higher-math", label: "উচ্চতর গণিত", count: subjectCounts["higher-math"] },
    { id: "biology", label: "জীববিজ্ঞান", count: subjectCounts.biology },
    { id: "ict", label: "আইসিটি", count: subjectCounts.ict },
  ];

  const filteredList = useMemo(() => {
    return pdfList.filter((item) => {
      // Subject match
      if (subject !== "all") {
        const s = (item.subject || "").toLowerCase();
        if (subject === "physics" && !s.includes("phys") && !s.includes("পদার্থ")) return false;
        if (subject === "chemistry" && !s.includes("chem") && !s.includes("রসায়ন") && !s.includes("রসায়ন")) return false;
        if (subject === "higher-math" && !s.includes("math") && !s.includes("গণিত")) return false;
        if (subject === "biology" && !s.includes("bio") && !s.includes("জীব")) return false;
        if (subject === "ict" && !s.includes("ict") && !s.includes("তথ্য")) return false;
      }

      // Paper match
      if (paper !== "all" && item.paper !== paper) return false;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const title = (item.title || "").toLowerCase();
      const ch = (item.chapter || "").toLowerCase();
      return title.includes(query) || ch.includes(query);
    });
  }, [pdfList, subject, paper, searchQuery]);

  useEffect(() => {
    if (filteredList.length > 0 && !selectedPdfId) {
      setSelectedPdfId(filteredList[0].id);
    } else if (
      filteredList.length > 0 &&
      !filteredList.some((p) => p.id === selectedPdfId)
    ) {
      setSelectedPdfId(filteredList[0].id);
    }
  }, [filteredList, selectedPdfId]);

  const selectedPdf = filteredList.find((p) => p.id === selectedPdfId);
  const previewUrl = selectedPdf
    ? formatGoogleDriveUrl(selectedPdf.fileUrl)
    : "";
  const downloadUrl = selectedPdf
    ? formatGoogleDriveDownloadUrl(selectedPdf.fileUrl)
    : "";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ─── Sticky Custom Tab Bar ────────────────────────────────────────── */}
      <CustomTabBar
        tabs={tabs}
        activeTab={subject}
        onTabChange={setSubject}
        searchPlaceholder="পিডিএফ বা অধ্যায় খুঁজুন..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toBanglaDigits={toBanglaDigits}
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1400px] mx-auto">
        {/* Left Column: Controls & List */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-5">
          <div className="bg-card rounded-3xl border border-border/70 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b bg-muted/30">
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                সাজেশন লাইব্রেরি
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                পত্র অনুযায়ী নির্বাচন করুন
              </p>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* Paper Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  পত্র ফিল্টার
                </span>
                <ToggleGroup
                  type="single"
                  value={paper}
                  onValueChange={(v) => v && setPaper(v)}
                  className="w-full h-9 p-1 bg-muted/40 rounded-xl border border-border/40"
                >
                  <ToggleGroupItem
                    value="all"
                    className="flex-1 rounded-lg text-xs font-semibold"
                  >
                    উভয়
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="1st"
                    className="flex-1 rounded-lg text-xs font-semibold"
                  >
                    ১ম পত্র
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="2nd"
                    className="flex-1 rounded-lg text-xs font-semibold"
                  >
                    ২য় পত্র
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

            {/* Available PDF List */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                ৩. পিডিএফ ফাইলসমূহ ({filteredList.length})
              </span>

              {isFetchingPdfs ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  <span>লোড হচ্ছে...</span>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                  কোনো পিডিএফ ফাইল পাওয়া যায়নি।
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {filteredList.map((pdf) => {
                    const isSelected = pdf.id === selectedPdfId;
                    return (
                      <button
                        type="button"
                        key={pdf.id}
                        onClick={() => {
                          setSelectedPdfId(pdf.id);
                          setIsLoading(true);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                            : "bg-muted/20 border-border/50 hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <span className="line-clamp-2">{pdf.title}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-primary">
                            {pdf.paper}
                          </span>
                          {pdf.chapter && <span>• {pdf.chapter}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Widget */}
        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 sm:p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
            <Flash className="size-20" />
          </div>
          <h4 className="font-bold text-primary flex items-center gap-1.5 mb-1.5 relative z-10 text-xs sm:text-sm">
            <Flash className="size-4" /> পড়াশোনার টিপস
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
            এখানে যুক্ত হওয়া প্রতিটি সাজেশন গুগল ড্রাইভ ক্লাউডে হোস্ট করা। প্রয়োজনে সরাসরি
            প্রিভিউ দেখে ডাউনলোড করে অফলাইনে পড়ার সুযোগ রয়েছে।
          </p>
        </div>
      </div>

      {/* Right Column: PDF Viewer */}
      <div className="flex-1 flex flex-col">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col h-[550px] lg:h-[calc(100vh-160px)] lg:min-h-[650px]">
          {/* Viewer Header */}
          <div className="p-3 sm:p-4 border-b bg-muted/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 text-primary shrink-0" />
              <h2 className="font-bold text-sm sm:text-base truncate">
                {selectedPdf?.title || "কোনো ফাইল নির্বাচিত নেই"}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedPdf ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  render={
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <Export className="size-3.5" />{" "}
                  <span className="hidden sm:inline">ট্যাবে খুলুন</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-semibold"
                  disabled
                >
                  <span>ট্যাবে খুলুন</span>
                </Button>
              )}

              {selectedPdf ? (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-bold"
                  render={
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <Download className="size-3.5" />{" "}
                  <span className="hidden sm:inline">ডাউনলোড</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-bold"
                  disabled
                >
                  <span>ডাউনলোড</span>
                </Button>
              )}
            </div>
          </div>

          {/* Viewer Body */}
          <div className="flex-1 relative bg-muted/10 flex flex-col">
            {selectedPdf ? (
              <PdfEmbedViewer
                url={selectedPdf.fileUrl}
                title={selectedPdf.title}
                className="w-full h-full"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
                  <FileDown className="size-8 text-primary/40" />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  কোনো পিডিএফ নির্বাচন করা হয়নি
                </h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mt-1.5">
                  বামপাশের তালিকা থেকে যে কোনো সাজেশনের ওপর ক্লিক করে এখানে সরাসরি ড্রাইভ
                  প্রিভিউ দেখুন।
                </p>
              </div>
            )}
          </div>

          {/* Viewer Footer */}
          <div className="h-10 bg-muted/40 border-t px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <Lock className="size-3 text-emerald-500" />
              <span>Square PDF Reader Engine</span>
            </div>
            {selectedPdf && (
              <a
                href={selectedPdf.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium group"
              >
                ড্রাইভে দেখুন
                <ArrowRight2 className="size-3 transform group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
