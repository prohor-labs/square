"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { updateContainerAction } from "@/lib/actions/question";
import type { Container } from "@/types";

interface EditQuestionBankFormProps {
  readonly qb: Container;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function EditQuestionBankForm({
  qb,
  onSuccess,
  onCancel,
}: EditQuestionBankFormProps) {
  const [title, setTitle] = useState(qb.title || "");
  const [slug, setSlug] = useState(qb.slug || "");
  const [description, setDescription] = useState(qb.description || "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    setIsPending(true);
    setError(null);
    const res = await updateContainerAction(qb.id, {
      title,
      slug,
      description,
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

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>শিরোনাম (Title)</FieldLabel>
          <Input
            required
            placeholder="যেমন: HSC 2026 প্রস্তুতি প্রশ্নব্যাংক"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Slug</FieldLabel>
          <Input
            required
            placeholder="hsc-2026"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>বিবরণ (Description)</FieldLabel>
          <Textarea
            rows={3}
            placeholder="প্রশ্নব্যাংকের বিবরণ..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
