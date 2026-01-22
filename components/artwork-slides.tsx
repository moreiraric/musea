"use client";

import { useCallback, useRef, useState } from "react";

type Slide = {
  title: string;
  body: string;
};

const slideWidth = 275;
const slideGap = 64;

export function ArtworkSlides({ slides }: { slides: Slide[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const stride = slideWidth + slideGap;
    const nextIndex = Math.round(container.scrollLeft / stride);
    const clampedIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
    setActiveIndex(clampedIndex);
  }, [slides.length]);

  return (
    <div className="-mx-[20px]">
      <div
        ref={containerRef}
        className="hide-scrollbar flex w-[calc(100%+40px)] gap-[64px] overflow-x-auto pb-[4px] pl-[20px] pr-[calc(20px+50%)] [scroll-padding-left:20px] [scroll-snap-type:x_mandatory]"
        onScroll={handleScroll}
      >
        {slides.map((slide, index) => (
          <article
            key={`${slide.title}-${index}`}
            className="flex w-[275px] shrink-0 flex-col gap-[4px] [scroll-snap-align:start]"
          >
            <h2 className="text-[20px] font-semibold leading-[28px] text-[#303030] [font-family:var(--font-literata)]">
              {slide.title}
            </h2>
            <p className="text-[18px] font-normal leading-[26px] text-[#303030] [font-family:var(--font-literata)]">
              {slide.body}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-[8px] flex justify-end pr-[20px]">
        <span className="text-[12px] font-medium text-[#757575] [font-family:var(--font-instrument-sans)]">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
