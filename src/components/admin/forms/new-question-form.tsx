"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuestion } from "@/hooks/use-admin-qb";
import { cn } from "@/lib/utils";

interface NewQuestionFormProps {
  readonly subjectId: string;
  readonly chapterId: string;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function NewQuestionForm({
  subjectId,
  chapterId,
  onSuccess,
  onCancel,
}: NewQuestionFormProps) {
  const [type, setType] = useState<"mcq" | "cq">("mcq");
  const [source, setSource] = useState("Board");
  const [standard, setStandard] = useState("HSC");
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explanationImage, setExplanationImage] = useState("");

  const [isFree, setIsFree] = useState(false);

  const [mcqOptions, setMcqOptions] = useState([
    { key: "opt-slot-0", optionText: "", image: "", isCorrect: true },
    { key: "opt-slot-1", optionText: "", image: "", isCorrect: false },
    { key: "opt-slot-2", optionText: "", image: "", isCorrect: false },
    { key: "opt-slot-3", optionText: "", image: "", isCorrect: false },
  ]);

  const createMutation = useCreateQuestion();

  const handleOptionChange = (idx: number, text: string) => {
    const next = [...mcqOptions];
    next[idx].optionText = text;
    setMcqOptions(next);
  };

  const handleOptionImageChange = (idx: number, image: string) => {
    const next = [...mcqOptions];
    next[idx].image = image;
    setMcqOptions(next);
  };

  /** Several options can be correct, so this toggles instead of replacing. */
  const handleCorrectToggle = (idx: number) => {
    const next = mcqOptions.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx ? !opt.isCorrect : opt.isCorrect,
    }));
    setMcqOptions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText) return;

    createMutation.mutate(
      {
        subjectId,
        chapterId,
        type,
        source: source.trim() || "Custom",
        standard: standard.trim() || "HSC",
        questionText,
        questionImage,
        explanation,
        explanationImage,
        isFree,
        mcqOptions: type === "mcq" ? mcqOptions : undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {createMutation.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {createMutation.error.message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel>টাইপ</FieldLabel>
          <NativeSelect
            className="w-full"
            value={type}
            onChange={(e) => setType(e.target.value as "mcq" | "cq")}
          >
            <NativeSelectOption value="mcq">MCQ (বহুনির্বাচনী)</NativeSelectOption>
            <NativeSelectOption value="cq">CQ (সৃজনশীল)</NativeSelectOption>
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel>উৎস (Source)</FieldLabel>
          <Input
            placeholder="যেমন: কুমিল্লা বোর্ড ২০২৩, ঢাকা বোর্ড ২০২২..."
            value={source}
            onChange={(e) => setSource(e.target.value)}
            list="new-source-suggestions"
          />
          <datalist id="new-source-suggestions">
            <option value="ঢাকা বোর্ড ২০২৩" />
            <option value="কুমিল্লা বোর্ড ২০২৩" />
            <option value="চট্টগ্রাম বোর্ড ২০২৩" />
            <option value="রাজশাহী বোর্ড ২০২৩" />
            <option value="যশোর বোর্ড ২০২৩" />
            <option value="সিলেট বোর্ড ২০২৩" />
            <option value="বরিশাল বোর্ড ২০২৩" />
            <option value="দিনাজপুর বোর্ড ২০২৩" />
            <option value="ময়মনসিংহ বোর্ড ২০২৩" />
            <option value="Custom" />
          </datalist>
        </Field>

        <Field>
          <FieldLabel>মান / স্তর (Standard)</FieldLabel>
          <NativeSelect
            className="w-full"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
          >
            <NativeSelectOption value="HSC">HSC</NativeSelectOption>
            <NativeSelectOption value="Varsity">Varsity</NativeSelectOption>
            <NativeSelectOption value="Engineering">
              Engineering
            </NativeSelectOption>
            <NativeSelectOption value="Medical">Medical</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>

      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/70">
        <input
          type="checkbox"
          id="new-question-is-free"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="size-4 rounded accent-primary cursor-pointer"
        />
        <label
          htmlFor="new-question-is-free"
          className="text-xs font-bold text-foreground cursor-pointer"
        >
          🌐 সবার জন্য উন্মুক্ত / ফ্রি প্রশ্ন (লগইন থাকুক বা না থাকুক সবাই দেখতে ও অনুশীলন করতে
          পারবে)
        </label>
      </div>

      <Field>
        <FieldLabel>প্রশ্নের বিবরণ (LaTeX সম্বলিত)</FieldLabel>
        <Textarea
          required
          rows={3}
          placeholder="যেমন: দুটি সমান মানের ভেক্টরের লব্ধির মান..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
        <Input
          placeholder="প্রশ্নের ছবির URL (অপশনাল)"
          value={questionImage}
          onChange={(e) => setQuestionImage(e.target.value)}
        />
      </Field>

      {type === "mcq" && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">MCQ অপশনসমূহ</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {mcqOptions.map((opt, idx) => (
              <div
                key={opt.key}
                className={cn(
                  "flex items-start gap-2 rounded-md border p-2 transition-colors",
                  opt.isCorrect
                    ? "border-primary/40 bg-primary/5"
                    : "border-input",
                )}
              >
                <input
                  type="checkbox"
                  name="correctOption"
                  checked={opt.isCorrect}
                  onChange={() => handleCorrectToggle(idx)}
                  className="mt-2 size-4 shrink-0 accent-primary"
                  aria-label={`অপশন ${idx + 1} সঠিক হিসেবে চিহ্নিত করুন`}
                />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Input
                    placeholder={`অপশন ${idx + 1}`}
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                  />
                  <Input
                    placeholder="ছবির URL (অপশনাল)"
                    value={opt.image}
                    onChange={(e) =>
                      handleOptionImageChange(idx, e.target.value)
                    }
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            সঠিক উত্তরের পাশের ঘরটিতে টিক দিন — একাধিক সঠিক থাকলে একাধিক টিক দেওয়া
            যাবে।
          </p>
        </div>
      )}

      <Field>
        <FieldLabel>ব্যাখ্যা (Optional)</FieldLabel>
        <Textarea
          rows={2}
          placeholder="প্রশ্নের বিস্তারিত ব্যাখ্যা..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <Input
          placeholder="ব্যাখ্যার ছবির URL (অপশনাল)"
          value={explanationImage}
          onChange={(e) => setExplanationImage(e.target.value)}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          বাতিল
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Spinner className="size-4 mr-2" /> সংরক্ষণ হচ্ছে...
            </>
          ) : (
            "সংরক্ষণ করুন"
          )}
        </Button>
      </div>
    </form>
  );
}
