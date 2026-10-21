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
import { useUpdateQuestion } from "@/hooks/use-admin-qb";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

interface EditQuestionFormProps {
  readonly question: Question;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function EditQuestionForm({
  question,
  onSuccess,
  onCancel,
}: EditQuestionFormProps) {
  const [type, setType] = useState<"mcq" | "cq">(question.type || "mcq");
  const [source, setSource] = useState(question.source || "Custom");
  const normalizedStandard = (() => {
    const s = question.standard?.toLowerCase();
    if (s === "varsity") return "Varsity";
    if (s === "engineering") return "Engineering";
    if (s === "medical") return "Medical";
    return "HSC";
  })();
  const [standard, setStandard] = useState(normalizedStandard);
  const [questionText, setQuestionText] = useState(
    question.questionText || question.question_text || "",
  );
  const [questionImage, setQuestionImage] = useState(
    question.questionImage || question.question_image || "",
  );
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [explanationImage, setExplanationImage] = useState(
    question.explanationImage || question.explanation_image || "",
  );

  const initialOptions = (question.mcqOptions || question.mcq_options)?.map(
    (o, idx) => ({
      key: o.id || `opt-slot-${idx}`,
      optionText: o.optionText || o.option_text || "",
      image: o.image || "",
      isCorrect: o.isCorrect ?? o.is_correct ?? false,
    }),
  ) || [
    { key: "opt-slot-0", optionText: "", image: "", isCorrect: true },
    { key: "opt-slot-1", optionText: "", image: "", isCorrect: false },
    { key: "opt-slot-2", optionText: "", image: "", isCorrect: false },
    { key: "opt-slot-3", optionText: "", image: "", isCorrect: false },
  ];

  const [isFree, setIsFree] = useState(
    Boolean(question.isFree || question.is_free),
  );

  const [mcqOptions, setMcqOptions] = useState(initialOptions);

  const initialParts = (question.cqParts || question.cq_parts)?.map((p) => ({
    partKey: p.partKey || p.part_key || "a",
    questionText: p.questionText || p.question_text || "",
    answerText: p.answerText || p.answer_text || "",
    marks: p.marks || 1,
  })) || [
    { partKey: "a", questionText: "", answerText: "", marks: 1 },
    { partKey: "b", questionText: "", answerText: "", marks: 2 },
    { partKey: "c", questionText: "", answerText: "", marks: 3 },
    { partKey: "d", questionText: "", answerText: "", marks: 4 },
  ];

  const [cqParts, setCqParts] = useState(initialParts);

  const updateMutation = useUpdateQuestion();

  const handleOptionChange = (idx: number, text: string) => {
    const next = [...mcqOptions];
    next[idx] = { ...next[idx], optionText: text };
    setMcqOptions(next);
  };

  const handleOptionImageChange = (idx: number, image: string) => {
    const next = [...mcqOptions];
    next[idx] = { ...next[idx], image };
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

  const handlePartChange = (
    idx: number,
    field: "questionText" | "answerText" | "marks",
    value: string | number,
  ) => {
    const next = [...cqParts];
    next[idx] = { ...next[idx], [field]: value };
    setCqParts(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText) return;

    updateMutation.mutate(
      {
        id: question.id,
        payload: {
          type,
          source: source.trim() || "Custom",
          standard: standard.trim() || "HSC",
          questionText,
          questionImage,
          explanation,
          explanationImage,
          isFree,
          mcqOptions: type === "mcq" ? mcqOptions : undefined,
          cqParts: type === "cq" ? cqParts : undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1"
    >
      {updateMutation.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {updateMutation.error.message}
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
            list="edit-source-suggestions"
          />
          <datalist id="edit-source-suggestions">
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
          id="edit-question-is-free"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="size-4 rounded accent-primary cursor-pointer"
        />
        <label
          htmlFor="edit-question-is-free"
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
                  name="editCorrectOption"
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

      {type === "cq" && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">
            CQ উপ-প্রশ্নসমূহ (ক, খ, গ, ঘ)
          </span>
          <div className="flex flex-col gap-3">
            {cqParts.map((pt, idx) => (
              <div
                key={`part-${pt.partKey || idx}`}
                className="flex flex-col gap-2 rounded-xl border p-3 bg-muted/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-primary text-xs uppercase">
                    অংশ ({pt.partKey})
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">নম্বর:</span>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      className="w-16 h-7 text-xs text-center"
                      value={pt.marks}
                      onChange={(e) =>
                        handlePartChange(
                          idx,
                          "marks",
                          Number.parseInt(e.target.value, 10) || 1,
                        )
                      }
                    />
                  </div>
                </div>
                <Input
                  required
                  placeholder={`প্রশ্ন (${pt.partKey})...`}
                  value={pt.questionText}
                  onChange={(e) =>
                    handlePartChange(idx, "questionText", e.target.value)
                  }
                  className="text-xs"
                />
                <Textarea
                  rows={2}
                  placeholder={`উত্তর / সমাধান (${pt.partKey}) [ঐচ্ছিক]`}
                  value={pt.answerText}
                  onChange={(e) =>
                    handlePartChange(idx, "answerText", e.target.value)
                  }
                  className="text-xs"
                />
              </div>
            ))}
          </div>
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
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Spinner className="size-4 mr-2" /> আপডেট হচ্ছে...
            </>
          ) : (
            "আপডেট করুন"
          )}
        </Button>
      </div>
    </form>
  );
}
