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
        className="text-[17px] text-black [font-family:var(--font-inter)]"
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
          className="absolute bottom-0 right-0 bg-white pl-[6px] text-[17px] font-bold text-black [font-family:var(--font-inter)]"
          onClick={() => setIsExpanded(true)}
        >
          ...read more
        </button>
      ) : null}
    </div>
  );
}
