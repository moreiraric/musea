"use client";

// Expandable artist essay block with drag-friendly text scrolling.
// It keeps long copy collapsed until the user asks to read more.

import { useLayoutEffect, useRef, useState } from "react";
import { useMouseDragScroll } from "@/components/use-mouse-drag-scroll";

// === TYPES ===

type ArtistEssayProps = {
  text: string;
};

// Renders the artist biography text with overflow detection.
export function ArtistEssay({ text }: ArtistEssayProps) {
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
    handleDragStart,
  } = useMouseDragScroll<HTMLDivElement>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Only show the "See More" affordance when the collapsed text actually overflows.
  useLayoutEffect(() => {
    if (!paragraphRef.current || isExpanded) {
      return;
    }
    const el = paragraphRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, isExpanded]);

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
      onDragStart={handleDragStart}
    >
      <p
        ref={paragraphRef}
        className="text-body-default-sans text-[#1e1e1e]"
        style={
          isExpanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: 12,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {!isExpanded && isOverflowing ? (
        <button
          type="button"
          className="text-body-default-sans absolute bottom-0 right-0 bg-white pl-[6px] text-[#1e1e1e]"
          style={{ fontWeight: 500 }}
          onClick={() => setIsExpanded(true)}
        >
          ...See More
        </button>
      ) : null}
    </div>
  );
}
