"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft2, ArrowRight2, Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { RoutineImage } from "@/lib/actions/routine-images";
import { buildRoutinePdf } from "@/lib/routine-pdf";
import { cn } from "@/lib/utils";

/**
 * The routine as a swipeable set of pictures.
 *
 * One page at a time with arrows and swipe, because a weekly timetable is tall
 * and a grid of thumbnails would be unreadable. The download turns the same
 * pages into a PDF so a student can keep it on their phone.
 */
export function RoutineGallery({
  images,
  courseTitle,
}: {
  readonly images: readonly RoutineImage[];
  readonly courseTitle: string;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const go = useCallback(
    (step: number) => {
      setIndex((current) => {
        const next = current + step;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length],
  );

  const handleDownload = async () => {
    setBusy(true);
    const toastId = toast.loading("পিডিএফ তৈরি হচ্ছে...");
    try {
      const result = await buildRoutinePdf(images, `${courseTitle}-রুটিন`);
      if (!result.ok) {
        toast.error(result.error, { id: toastId });
        return;
      }
      toast.success("রুটিন ডাউনলোড হয়েছে", { id: toastId });
    } catch {
      toast.error("পিডিএফ বানানো যায়নি।", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  if (images.length === 0) return null;

  const current = images[Math.min(index, images.length - 1)];
  const single = images.length === 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black sm:text-xl">কোর্স রুটিন</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current.title || `পৃষ্ঠা ${index + 1} / ${images.length}`}
            {current.title && images.length > 1 && (
              <span className="ml-1.5">
                (পৃষ্ঠা {index + 1} / {images.length})
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={handleDownload}
          disabled={busy}
          className="h-10 shrink-0 cursor-pointer rounded-xl font-bold"
        >
          <Download className="size-4" />
          {busy ? "তৈরি হচ্ছে…" : "পিডিএফ ডাউনলোড"}
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
        <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
          <Image
            key={current.id}
            src={current.imageUrl}
            alt={current.title || `রুটিন পৃষ্ঠা ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
            className="animate-in object-contain fade-in duration-300"
          />
        </div>

        {!single && (
          <>
            <ArrowButton side="left" onClick={() => go(-1)} />
            <ArrowButton side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {!single && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`পৃষ্ঠা ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200 cursor-pointer",
                i === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  readonly side: "left" | "right";
  readonly onClick: () => void;
}) {
  const Arrow = side === "left" ? ArrowLeft2 : ArrowRight2;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "আগের পৃষ্ঠা" : "পরের পৃষ্ঠা"}
      className={cn(
        "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <Arrow className="size-4" />
    </button>
  );
}
