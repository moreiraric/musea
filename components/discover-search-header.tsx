"use client";

// Floating discover header that toggles between a search trigger and active input.
// It lives in the app viewport portal so the controls stay fixed over the content.

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTabScope } from "@/components/tab-state";

type DiscoverSearchHeaderProps = {
  query: string;
  isSearchOpen: boolean;
};

// Renders the discover header in either collapsed or expanded search mode.
export function DiscoverSearchHeader({
  query,
  isSearchOpen,
}: DiscoverSearchHeaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(query);
  const tabId = useTabScope();
  const portalTarget =
    typeof document === "undefined" ? null : document.getElementById("app-viewport");

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    // Delay focus until the portal content is mounted and painted.
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isSearchOpen]);

  // Empty submits keep the user on discover while clearing the active query.
  const submitSearch = () => {
    const next = value.trim();
    if (!next) {
      router.push("/discover?search=1");
      return;
    }
    router.push(`/discover?q=${encodeURIComponent(next)}`);
  };

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal pointer-events-none absolute left-0 top-0 z-30 w-full"
    >
      {!isSearchOpen ? (
        <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]">
          <div className="flex w-full items-center justify-end">
            <button
              type="button"
              aria-label="Open search"
              onClick={() => router.push("/discover?search=1")}
              className="pointer-events-auto flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-[24px] w-[24px]"
                src="/images/ui/nav/icon-search-outline.svg"
              />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-[100px] w-full items-end gap-[16px] bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.push("/discover")}
            className="pointer-events-auto flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white bg-[rgba(255,255,255,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/nav/icon-caret-left.svg"
            />
          </button>
          <form
            className="pointer-events-auto flex flex-1 items-center gap-[8px] rounded-full border border-white bg-[rgba(255,255,255,0.33)] px-[12px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <div className="flex items-center justify-center py-[8px]">
              <img
                alt=""
                aria-hidden="true"
                className="h-[18px] w-[18px]"
                src="/images/ui/nav/icon-search-outline.svg"
              />
            </div>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Search artists or artworks..."
              className="text-body-default-sans flex-1 bg-transparent text-black outline-none placeholder:text-[#b3b3b3]"
              enterKeyHint="search"
            />
            <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
              Search
            </button>
          </form>
        </div>
      )}
    </div>,
    portalTarget,
  );
}
