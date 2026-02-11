"use client";

import { useLayoutEffect, useRef, useState } from "react";

type ArtistEssayProps = {
  text: string;
};

export function ArtistEssay({ text }: ArtistEssayProps) {
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (!paragraphRef.current || isExpanded) {
      return;
    }
    const el = paragraphRef.current;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, isExpanded]);

  return (
    <div className="relative w-full">
      <p
        ref={paragraphRef}
        className="text-[18px] leading-[24px] text-black [font-family:var(--font-instrument-sans)]"
        style={
          isExpanded
            ? { fontVariationSettings: "'wdth' 100" }
            : {
                fontVariationSettings: "'wdth' 100",
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
          className="absolute bottom-0 right-0 bg-white pl-[6px] text-[18px] font-bold leading-[24px] text-black [font-family:var(--font-instrument-sans)]"
          onClick={() => setIsExpanded(true)}
          style={{ fontVariationSettings: "'wdth' 100" }}
        >
          ...See More
        </button>
      ) : null}
    </div>
  );
}
