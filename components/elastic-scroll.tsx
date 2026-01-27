"use client";

import { useEffect, useRef } from "react";

type ElasticScrollProps = {
  children: React.ReactNode;
};

export function ElasticScroll({ children }: ElasticScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }

    const setOffset = (value: number) => {
      offsetRef.current = value;
      content.style.transform = `translateY(${value}px)`;
    };

    const animateBack = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      const step = () => {
        const current = offsetRef.current;
        if (Math.abs(current) < 0.5) {
          setOffset(0);
          rafRef.current = null;
          return;
        }
        setOffset(current * 0.85);
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      const atTop = container.scrollTop <= 0;
      const atBottom = container.scrollTop >= maxScroll - 1;
      const delta = event.deltaY;

      if ((atTop && delta < 0) || (atBottom && delta > 0)) {
        event.preventDefault();
        const next = offsetRef.current - delta * 0.3;
        const clamped = Math.max(-110, Math.min(110, next));
        setOffset(clamped);
        animateBack();
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <main ref={containerRef} className="flex-1 overflow-y-auto pb-[100px]">
      <div ref={contentRef} className="will-change-transform">
        {children}
      </div>
    </main>
  );
}
