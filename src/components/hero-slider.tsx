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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 w-full">
      <div
        className="relative overflow-hidden w-full rounded-2xl sm:rounded-3xl border border-border/60 shadow-lg bg-black group aspect-16/7 sm:aspect-16/6 max-h-[460px]"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
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
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-2 sm:p-2.5 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:flex items-center justify-center border border-white/20 shadow-md hover:scale-105 active:scale-95"
            >
              <ArrowLeft2 className="size-4 sm:size-5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-2 sm:p-2.5 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:flex items-center justify-center border border-white/20 shadow-md hover:scale-105 active:scale-95"
            >
              <ArrowRight2 className="size-4 sm:size-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {sliderImages.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-30 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {sliderImages.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={slide.id || slide.alt || index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive ? "w-6 sm:w-8 bg-white" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
