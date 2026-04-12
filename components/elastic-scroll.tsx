"use client";

// Scroll container that adds a subtle elastic overscroll effect to the main viewport.
// It also disables scrolling when an overlay sheet or modal is open.

import { useEffect, useRef } from "react";

type ElasticScrollProps = {
  children: React.ReactNode;
};

// Wraps page content in a scroll area with controlled overscroll behavior.
export function ElasticScroll({ children }: ElasticScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const initialOverflowRef = useRef<string | null>(null);
  const initialPointerEventsRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }

    // Applies the current overscroll offset directly to the content layer.
    const setOffset = (value: number) => {
      offsetRef.current = value;
      content.style.transform = `translateY(${value}px)`;
    };

    // Eases the content back into place after the user hits the top or bottom edge.
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
      const overlayOpen =
        document
          .getElementById("app-viewport")
          ?.getAttribute("data-overlay-open") === "true";
      if (overlayOpen) {
        return;
      }
      const maxScroll = container.scrollHeight - container.clientHeight;
      const atTop = container.scrollTop <= 0;
      const atBottom = container.scrollTop >= maxScroll - 1;
      const delta = event.deltaY;

      // Only simulate elasticity when the wheel would push past a real scroll boundary.
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

  useEffect(() => {
    const container = containerRef.current;
    const viewport = document.getElementById("app-viewport");
    if (!container || !viewport) {
      return;
    }

    initialOverflowRef.current = container.style.overflowY || "";
    initialPointerEventsRef.current = container.style.pointerEvents || "";

    // Overlay sheets lock the main scroller so background content cannot move underneath them.
    const updateScrollLock = () => {
      const overlayOpen =
        viewport.getAttribute("data-overlay-open") === "true";
      if (overlayOpen) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        offsetRef.current = 0;
        contentRef.current?.style.setProperty("transform", "translateY(0px)");
      }
      container.style.overflowY = overlayOpen ? "hidden" : initialOverflowRef.current || "auto";
      container.style.pointerEvents = overlayOpen
        ? "none"
        : initialPointerEventsRef.current || "auto";
    };

    updateScrollLock();

    const observer = new MutationObserver(updateScrollLock);
    observer.observe(viewport, {
      attributes: true,
      attributeFilter: ["data-overlay-open"],
    });

    return () => {
      observer.disconnect();
      container.style.overflowY = initialOverflowRef.current || "";
      container.style.pointerEvents = initialPointerEventsRef.current || "";
    };
  }, []);

  return (
    <main ref={containerRef} className="flex-1 overflow-y-auto pb-[100px]">
      <div ref={contentRef} className="flex min-h-full flex-col will-change-transform">
        {children}
      </div>
    </main>
  );
}
