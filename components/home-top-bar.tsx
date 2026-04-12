"use client";

// Floating home header that owns the profile bubble interaction.
// It uses the shared viewport portal so the control stays pinned over scrolling content.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTabScope } from "@/components/tab-state";

// Renders the home page top bar and dismissible profile teaser.
export function HomeTopBar() {
  const [isProfileBubbleOpen, setIsProfileBubbleOpen] = useState(false);
  const bubbleTimeoutRef = useRef<number | null>(null);
  const profileBubbleRef = useRef<HTMLDivElement | null>(null);
  const tabId = useTabScope();
  const portalTarget =
    typeof document === "undefined"
      ? null
      : document.getElementById("app-viewport");

  useEffect(() => {
    if (!isProfileBubbleOpen) {
      if (bubbleTimeoutRef.current !== null) {
        window.clearTimeout(bubbleTimeoutRef.current);
        bubbleTimeoutRef.current = null;
      }
      return;
    }

    // Auto-close the bubble so it behaves like a temporary hint, not a sticky menu.
    bubbleTimeoutRef.current = window.setTimeout(() => {
      setIsProfileBubbleOpen(false);
      bubbleTimeoutRef.current = null;
    }, 3000);

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileBubbleRef.current?.contains(event.target as Node)) {
        setIsProfileBubbleOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      if (bubbleTimeoutRef.current !== null) {
        window.clearTimeout(bubbleTimeoutRef.current);
        bubbleTimeoutRef.current = null;
      }
    };
  }, [isProfileBubbleOpen]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal pointer-events-none absolute left-0 top-0 z-30 w-full"
    >
      <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[54px]">
        <div className="flex w-full items-center justify-end">
          <div ref={profileBubbleRef} className="pointer-events-auto relative">
            <button
              type="button"
              className="flex h-[40px] items-center rounded-full bg-[rgba(255,255,255,0.33)] px-[8px] py-[6px] shadow-[0px_0px_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
              aria-label="Open profile"
              onClick={() => setIsProfileBubbleOpen((current) => !current)}
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-[24px] w-[24px]"
                src="/images/ui/other/icon-user-outline.svg"
              />
            </button>
            {isProfileBubbleOpen ? (
              <button
                type="button"
                className="text-body-default-sans absolute right-0 top-[calc(100%+8px)] w-[220px] rounded-[20px] bg-[#e7e7e7] px-[16px] py-[12px] text-left text-[#1e1e1e] shadow-[0px_12px_32px_rgba(0,0,0,0.12)]"
                onClick={() => setIsProfileBubbleOpen(false)}
              >
                Profile page not simulated. Try other pages!
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
