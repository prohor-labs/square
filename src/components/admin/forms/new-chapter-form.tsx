"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createSubitemAction as createChapterAction } from "@/lib/actions/question";

interface NewChapterFormProps {
  readonly qbSlug: string;
  readonly subjectId: string;
  readonly subjectSlug: string;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function NewChapterForm({
  qbSlug,
  subjectId,
  subjectSlug,
  onSuccess,
  onCancel,
}: NewChapterFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setIsPending(true);
    setError(null);
    const res = await createChapterAction(
      subjectId,
      qbSlug,
      subjectSlug,
      name,
      slug.toLowerCase().trim(),
    );
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

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>সালের নাম (বাংলায়)</FieldLabel>
          <Input
            required
            placeholder="২০১৩-১৪"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>সাল Slug</FieldLabel>
          <Input
            required
            placeholder="2013-14"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          বাতিল
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
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
