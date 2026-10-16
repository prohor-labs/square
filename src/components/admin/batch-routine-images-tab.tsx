"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Add,
  ArrowLeft2,
  ArrowRight2,
  CalendarTick,
  Eye,
  Trash2,
} from "@/components/icons";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  createBatchRoutineImage,
  deleteBatchRoutineImage,
  getBatchRoutineImages,
  type RoutineImage,
  reorderBatchRoutineImages,
  updateBatchRoutineImage,
} from "@/lib/actions/routine-images";
import { cn } from "@/lib/utils";

/**
 * Add the routine as pictures, one page at a time.
 *
 * Images rather than a PDF because a course's timetable changes every group
 * and every week, and re-uploading one image beats re-uploading a document.
 * The order here is the order students swipe through, and the order the
 * generated PDF comes out in.
 */
export function BatchRoutineImagesTab({ batchId }: { batchId: string }) {
  const queryClient = useQueryClient();

  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery<RoutineImage[]>({
    queryKey: ["batch-routine-images", batchId],
    queryFn: () => getBatchRoutineImages(batchId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["batch-routine-images", batchId],
    });

  const createMutation = useMutation({
    mutationFn: (payload: { imageUrl: string; title?: string }) =>
      createBatchRoutineImage(batchId, payload),
    onSuccess: async (res) => {
      if (!res.success) {
        setFormError(res.message || "ছবি যোগ করা যায়নি");
        return;
      }
      await invalidate();
      setImageUrl("");
      setTitle("");
      setFormError(null);
      toast.success("রুটিন ছবি যোগ হয়েছে");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBatchRoutineImage(id),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderBatchRoutineImages(batchId, orderedIds),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title: next }: { id: string; title: string }) =>
      updateBatchRoutineImage(id, { title }),
    onSuccess: invalidate,
  });

  /** Swaps a row with its neighbour, then writes the new order down. */
  const move = (index: number, step: number) => {
    const next = [...images];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((image) => image.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarTick className="size-5 text-primary" />
            কোর্স রুটিন ({images.length} পৃষ্ঠা)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            রুটিনের প্রতিটি পৃষ্ঠার ছবির লিঙ্ক দিন। শিক্ষার্থীরা সোয়াইপ করে দেখতে পারবেন,
            চাইলে পিডিএফ হিসেবেও নামাতে পারবেন।
          </p>
        </div>
      </div>

      {/* Add form — two at a time is the usual rhythm: a weekly timetable is
          often split into a first-week and a second-week picture. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!imageUrl.trim()) {
            setFormError("ছবির লিঙ্ক দিন।");
            return;
          }
          setFormError(null);
          createMutation.mutate({ imageUrl, title });
        }}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
      >
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <Label htmlFor="routine-image-url">ছবির লিঙ্ক *</Label>
            <Input
              id="routine-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://.../routine-week-1.png"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="routine-image-title">শিরোনাম (ঐচ্ছিক)</Label>
            <Input
              id="routine-image-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: সপ্তাহ ১ — সেকেন্ড গ্রুপ"
            />
          </div>
          {formError && (
            <p className="text-xs font-semibold text-destructive">
              {formError}
            </p>
          )}
        </div>

        <div className="flex sm:flex-col justify-end">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="h-10 w-full cursor-pointer rounded-xl font-bold sm:w-auto"
          >
            <Add className="size-4" />
            যোগ করুন
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Spinner className="size-8 text-primary mb-3" />
          <p className="text-sm text-muted-foreground">রুটিন ছবি লোড হচ্ছে...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed bg-muted/10 p-12 text-center">
          <CalendarTick className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-base text-foreground">
            এখনো কোনো রুটিন ছবি যোগ করা হয়নি
          </h3>
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">
            উপরের ফর্মে ছবির লিঙ্ক দিয়ে প্রথম পৃষ্ঠাটি যোগ করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element -- the admin
                    list shows arbitrary remote links that Next cannot optimise. */}
                <img
                  src={image.imageUrl}
                  alt={image.title || `পৃষ্ঠা ${index + 1}`}
                  className="size-full object-contain"
                />
                <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white">
                  পৃষ্ঠা {index + 1}
                </span>
              </div>

              <TitleEditor
                image={image}
                disabled={updateMutation.isPending}
                onSave={(next) =>
                  updateMutation.mutate({ id: image.id, title: next })
                }
              />

              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                <div className="flex items-center gap-1">
                  <MoveButton
                    label="আগের পৃষ্ঠায়"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorderMutation.isPending}
                  >
                    <ArrowLeft2 className="size-4" />
                  </MoveButton>
                  <MoveButton
                    label="পরের পৃষ্ঠায়"
                    onClick={() => move(index, 1)}
                    disabled={
                      index === images.length - 1 || reorderMutation.isPending
                    }
                  >
                    <ArrowRight2 className="size-4" />
                  </MoveButton>
                </div>

                <a
                  href={image.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ছবিটি আলাদা খুলুন"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Eye className="size-4" />
                </a>

                <DeleteConfirmDialog
                  title="রুটিন ছবি মুছে ফেলা হবে"
                  description={`"${image.title || `পৃষ্ঠা ${index + 1}`}" ছবিটি মুছে যাবে। নিশ্চিত?`}
                  onConfirm={async () => {
                    await deleteMutation.mutateAsync(image.id);
                  }}
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteMutation.isPending}
                      className="size-8 cursor-pointer rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TitleEditor({
  image,
  disabled,
  onSave,
}: {
  readonly image: RoutineImage;
  readonly disabled: boolean;
  readonly onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(image.title ?? "");

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={`routine-title-${image.id}`}
        className="text-xs text-muted-foreground"
      >
        শিরোনাম
      </Label>
      <Input
        id={`routine-title-${image.id}`}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value !== (image.title ?? "")) onSave(value);
        }}
        placeholder="যেমন: সপ্তাহ ১"
        className="h-9 text-xs"
      />
    </div>
  );
}

function MoveButton({
  label,
  onClick,
  disabled,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
