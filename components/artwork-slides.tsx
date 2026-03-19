"use client";

import { useRef, useState } from "react";
import { useMouseDragScroll } from "@/components/use-mouse-drag-scroll";

type Slide = {
  title: string;
  body: string;
};

const slideWidth = 275;
const slideGap = 64;

export function ArtworkSlides({ slides }: { slides: Slide[] }) {
  const snapResetTimeoutRef = useRef<number | null>(null);
  const handleDragStartState = (scrollTarget: HTMLElement) => {
    if (snapResetTimeoutRef.current !== null) {
      window.clearTimeout(snapResetTimeoutRef.current);
      snapResetTimeoutRef.current = null;
    }

    scrollTarget.style.scrollBehavior = "auto";
    scrollTarget.style.scrollSnapType = "none";
  };

  const handleDragEndState = (scrollTarget: HTMLElement) => {
    const stride = slideWidth + slideGap;
    const maxIndex = Math.max(0, slides.length - 1);
    const nextIndex = Math.max(0, Math.min(maxIndex, Math.round(scrollTarget.scrollLeft / stride)));
    const nextLeft = nextIndex * stride;

    scrollTarget.style.scrollSnapType = "x mandatory";
    scrollTarget.style.scrollBehavior = "smooth";
    scrollTarget.scrollTo({ left: nextLeft, behavior: "smooth" });

    snapResetTimeoutRef.current = window.setTimeout(() => {
      scrollTarget.style.scrollBehavior = "";
      scrollTarget.style.scrollSnapType = "";
      snapResetTimeoutRef.current = null;
    }, 220);
  };

  const {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
    handleDragStart,
  } =
    useMouseDragScroll<HTMLDivElement>({
      axis: "x",
      onDragStart: handleDragStartState,
      onDragEnd: handleDragEndState,
    });
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const stride = slideWidth + slideGap;
    const nextIndex = Math.round(container.scrollLeft / stride);
    const clampedIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
    setActiveIndex(clampedIndex);
  };

  return (
    <div className="-mx-[20px]">
      <div
        ref={containerRef}
        className="hide-scrollbar flex w-[calc(100%+40px)] cursor-grab gap-[64px] overflow-x-auto pb-[4px] pl-[20px] pr-[calc(20px+50%)] active:cursor-grabbing [scroll-padding-left:20px] [scroll-snap-type:x_mandatory]"
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onDragStart={handleDragStart}
      >
        {slides.map((slide, index) => (
          <article
            key={`${slide.title}-${index}`}
            className="flex w-[275px] shrink-0 flex-col gap-[4px] [scroll-snap-align:start]"
          >
            <h2 className="text-header-content-h2 text-[#303030]">
              {slide.title}
            </h2>
            <p className="text-body-longform-serif text-[#303030]">
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
