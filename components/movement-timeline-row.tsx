"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";

type MovementTimelineItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
  href?: string;
  isActive?: boolean;
};

function MovementChip({
  name,
  iconUrl,
  href,
  isActive = false,
}: {
  name: string;
  iconUrl?: string | null;
  href?: string;
  isActive?: boolean;
}) {
  const chipClassName = isActive
    ? "flex shrink-0 items-center gap-[4px] rounded-[16px] border border-[#d9d9d9] bg-[#d9d9d9] pl-[8px] pr-[16px] py-[8px] leading-none"
    : "flex shrink-0 items-center gap-[4px] rounded-[16px] border border-[#d9d9d9] bg-white pl-[8px] pr-[16px] py-[8px] leading-none";

  const content = (
    <>
      {iconUrl ? (
        <img
          alt=""
          className="h-[27px] w-[27px] shrink-0 object-contain"
          src={iconUrl}
          style={isActive ? { filter: "grayscale(1) brightness(0.5)" } : undefined}
        />
      ) : null}
      <span
        className={`text-label-chip text-center whitespace-nowrap ${
          isActive ? "text-[#757575]" : "text-black"
        }`}
      >
        {name}
      </span>
    </>
  );

  if (!href || isActive) {
    return (
      <div className={chipClassName} aria-current={isActive ? "true" : "false"}>
        {content}
      </div>
    );
  }

  return (
    <Link className={chipClassName} href={href}>
      {content}
    </Link>
  );
}

export function MovementTimelineRow({
  items,
  className,
}: {
  items: MovementTimelineItem[];
  className?: string;
}) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const activeChipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const centerActiveChip = (behavior: ScrollBehavior = "auto") => {
      const activeChip = activeChipRef.current;
      const timeline = timelineRef.current;
      if (!activeChip || !timeline) {
        return;
      }
      const timelineRect = timeline.getBoundingClientRect();
      const activeRect = activeChip.getBoundingClientRect();
      const offset =
        activeRect.left -
        timelineRect.left -
        (timelineRect.width / 2 - activeRect.width / 2);
      const maxScrollLeft = Math.max(0, timeline.scrollWidth - timeline.clientWidth);
      const nextLeft = Math.max(0, Math.min(maxScrollLeft, timeline.scrollLeft + offset));
      timeline.scrollTo({
        left: nextLeft,
        behavior,
      });
    };

    centerActiveChip("auto");
    const frameId = requestAnimationFrame(() => {
      centerActiveChip("auto");
    });
    const timeoutId = window.setTimeout(() => {
      centerActiveChip("auto");
    }, 120);

    const onResize = () => {
      centerActiveChip("auto");
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
    };
  }, [items]);

  return (
    <HorizontalDragScroll
      ref={timelineRef}
      className={className ?? "flex w-full items-center gap-[8px] overflow-x-auto px-[20px] pb-[4px] hide-scrollbar"}
    >
      {items.map((item) => (
        <div
          key={item.id}
          ref={item.isActive ? activeChipRef : undefined}
          className="shrink-0"
        >
          <MovementChip
            name={item.name}
            iconUrl={item.iconUrl}
            isActive={item.isActive}
            href={item.href}
          />
        </div>
      ))}
    </HorizontalDragScroll>
  );
}
