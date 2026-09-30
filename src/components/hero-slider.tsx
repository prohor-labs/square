"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft2, ArrowRight2 } from "@/components/icons";
import type { SliderItem } from "@/lib/actions/settings";

const DEFAULT_IMAGES: SliderItem[] = [
  {
    id: "slide-1",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 1",
  },
  {
    id: "slide-2",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 2",
  },
  {
    id: "slide-3",
    url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
    alt: "Slider 3",
  },
];

export function HeroSlider({ slides }: { slides?: SliderItem[] }) {
  const sliderImages = slides && slides.length > 0 ? slides : DEFAULT_IMAGES;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
  };

  return (
    <section
      className="relative overflow-hidden w-full bg-black group"
      style={{ aspectRatio: "16 / 9", maxHeight: "500px" }}
    >
      <div className="relative w-full h-full">
        {sliderImages.map((slide, index) => {
          const isActive = index === currentIndex;
          const content = (
            <div
              key={slide.id || slide.alt || index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                alt={slide.alt || "Hero Banner"}
                className="w-full h-full object-cover"
                src={slide.url || "/images/image.png"}
                fill
                priority={index === 0}
                unoptimized
              />
            </div>
          );

          if (slide.link) {
            return (
              <Link key={slide.id || slide.alt || index} href={slide.link}>
                {content}
              </Link>
            );
          }

          return content;
        })}
      </div>

      {/* Prev Button */}
      {sliderImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2.5 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:block"
          >
            <ArrowLeft2 className="size-5" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2.5 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:block"
          >
            <ArrowRight2 className="size-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {sliderImages.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {sliderImages.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={slide.id || slide.alt || index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isActive ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
