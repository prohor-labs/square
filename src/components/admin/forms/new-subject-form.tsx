"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createItemAction as createSubjectAction } from "@/lib/actions/question";

interface NewSubjectFormProps {
  readonly qbId: string;
  readonly qbSlug: string;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export function NewSubjectForm({
  qbId,
  qbSlug,
  onSuccess,
  onCancel,
}: NewSubjectFormProps) {
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !slug || !name) return;

    setIsPending(true);
    setError(null);
    const res = await createSubjectAction(
      qbId,
      qbSlug,
      id.toLowerCase().trim(),
      slug.toLowerCase().trim(),
      name,
      code,
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
          <FieldLabel>ইউনিট আইডি</FieldLabel>
          <Input
            required
            placeholder="PHY (অভ্যন্তরীণ আইডি)"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>ইউনিট Slug</FieldLabel>
          <Input
            required
            placeholder="physics"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>ইউনিটের নাম (বাংলায়)</FieldLabel>
        <Input
          required
          placeholder="বিজ্ঞান"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
