"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { updateSubitemAction as updateChapterAction } from "@/lib/actions/question";
import type { Subitem } from "@/types";

interface EditChapterFormProps {
  readonly qbSlug: string;
  readonly subjectSlug: string;
  readonly chapter: Subitem;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function EditChapterForm({
  qbSlug,
  subjectSlug,
  chapter,
  onSuccess,
  onCancel,
}: EditChapterFormProps) {
  const [name, setName] = useState(chapter.name || "");
  const [slug, setSlug] = useState(chapter.slug || "");
  const [paper, setPaper] = useState<string>(chapter.paper || "none");
  const [orderNo, setOrderNo] = useState<number>(chapter.orderNo ?? 0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setIsPending(true);
    setError(null);
    const res = await updateChapterAction(chapter.id, qbSlug, subjectSlug, {
      name,
      slug,
      paper: paper === "none" ? undefined : paper,
      orderNo: Number(orderNo) || 0,
    });
    setIsPending(false);

    if (res.error) {
      setError(res.error);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Field>
        <FieldLabel>সালের নাম (বাংলায়)</FieldLabel>
        <Input
          required
          placeholder="২০১৩-১৪"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>সাল Slug</FieldLabel>
          <Input
            required
            placeholder="2013-14"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>পত্র / Paper (ঐচ্ছিক)</FieldLabel>
          <Select value={paper} onValueChange={setPaper}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="পত্র নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">কোনোটি নয়</SelectItem>
              <SelectItem value="1st">১ম পত্র (1st Paper)</SelectItem>
              <SelectItem value="2nd">২য় পত্র (2nd Paper)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          বাতিল
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
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
