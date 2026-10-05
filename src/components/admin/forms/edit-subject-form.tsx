"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { updateItemAction as updateSubjectAction } from "@/lib/actions/question";

interface EditSubjectFormProps {
  readonly qbSlug: string;
  /** Only the identity fields are read — the counts on a unit are not editable. */
  readonly subject: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly code: string | null;
  };
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function EditSubjectForm({
  qbSlug,
  subject,
  onSuccess,
  onCancel,
}: EditSubjectFormProps) {
  const [name, setName] = useState(subject.name || "");
  const [slug, setSlug] = useState(subject.slug || "");
  const [code, setCode] = useState(subject.code || "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setIsPending(true);
    setError(null);
    const res = await updateSubjectAction(subject.id, qbSlug, {
      name,
      slug,
      code,
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
        <FieldLabel>ইউনিটের নাম (বাংলায়)</FieldLabel>
        <Input
          required
          placeholder="বিজ্ঞান"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>ইউনিট Slug</FieldLabel>
          <Input
            required
            placeholder="science"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>ইউনিট কোড (Optional)</FieldLabel>
          <Input
            placeholder="SCI101"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
