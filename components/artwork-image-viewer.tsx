"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useTabScope } from "@/components/tab-state";

type ArtworkImageViewerProps = {
  src: string;
  alt: string;
};

export function ArtworkImageViewer({ src, alt }: ArtworkImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const touchStartY = useRef<number | null>(null);
  const tabId = useTabScope();
  const portalTarget =
    typeof document === "undefined" ? null : document.getElementById("app-viewport");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const toggleZoom = () => {
    setScale((current) => (current === 1 ? 2 : 1));
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (scale !== 1) {
      return;
    }
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (scale !== 1 || touchStartY.current === null) {
      return;
    }
    const endY = event.changedTouches[0]?.clientY ?? null;
    if (endY !== null && endY - touchStartY.current > 80) {
      setIsOpen(false);
    }
    touchStartY.current = null;
  };

  return (
    <>
      <button
        type="button"
        className="flex h-full w-full items-center justify-center"
        onClick={() => setIsOpen(true)}
        aria-label="Open artwork image"
      >
        <img
          alt={alt}
          className="block max-h-full w-auto max-w-full object-contain"
          src={src}
        />
      </button>

      {isOpen
        ? createPortal(
            <div
              data-tab={tabId}
              className="tab-portal absolute inset-0 z-[9999] bg-black/90"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsOpen(false)}
            >
              <button
                type="button"
                aria-label="Close image"
                className="absolute right-[16px] top-[16px] z-10 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/10 text-[24px] text-white"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
              <div
                className="absolute inset-0 flex items-center justify-center overflow-auto p-[20px]"
                style={{ touchAction: "pan-x pan-y pinch-zoom" }}
                onClick={(event) => event.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  alt={alt}
                  className="max-h-full max-w-full"
                  src={src}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                    transition: "transform 150ms ease",
                  }}
                  onDoubleClick={toggleZoom}
                />
              </div>
            </div>,
            portalTarget ?? document.body,
          )
        : null}
    </>
  );
}
