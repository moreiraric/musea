"use client";

// Floating artwork detail header rendered through the shared viewport portal.
// It handles back navigation, local saved state, and native sharing for the current artwork.

import { createPortal } from "react-dom";
import { useState } from "react";
import { useTabScope, useTabState } from "@/components/tab-state";

type ArtworkTopBarProps = {
  artwork: {
    id: string;
    slug: string | null;
    title: string;
    image_url: string | null;
  };
  artist?: {
    id: string;
    slug: string | null;
    name: string;
  } | null;
};

const STORAGE_KEY = "savedArtworks";

// Renders the artwork page top bar controls.
export function ArtworkTopBar({ artwork, artist }: ArtworkTopBarProps) {
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      return list.some(
        (item: { id?: string; slug?: string }) =>
          item?.id === artwork.id || (artwork.slug && item?.slug === artwork.slug),
      );
    } catch {
      return false;
    }
  });
  const tabId = useTabScope();
  const { goBackInTab } = useTabState();
  const portalTarget =
    typeof document === "undefined" ? null : document.getElementById("app-viewport");

  if (!portalTarget) {
    return null;
  }

  // Mirrors the saved-artwork state into local storage so the Saved tab can read it.
  const handleSave = () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const exists = list.some(
        (item: { id?: string; slug?: string }) =>
          item?.id === artwork.id || (artwork.slug && item?.slug === artwork.slug),
      );
      let next = list;
      if (exists) {
        next = list.filter(
          (item: { id?: string; slug?: string }) =>
            item?.id !== artwork.id && (artwork.slug ? item?.slug !== artwork.slug : true),
        );
      } else {
        next = [
          {
            id: artwork.id,
            slug: artwork.slug,
            title: artwork.title,
            image_url: artwork.image_url ?? null,
            artist_name: artist?.name ?? null,
          },
          ...list,
        ];
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setIsSaved(!exists);
    } catch {
      // ignore storage errors
    }
  };

  // Uses the browser share sheet when available.
  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const shareUrl = `${window.location.origin}/artwork/${artwork.slug ?? artwork.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          url: shareUrl,
        });
        return;
      } catch {
        // ignore
      }
    }
  };

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal absolute left-0 top-0 z-30 w-full bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            type="button"
            onClick={() => goBackInTab(tabId)}
            aria-label="Go back"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/nav/icon-caret-left.svg"
            />
          </button>
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            type="button"
            aria-label="Save artwork"
            onClick={handleSave}
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src={
                isSaved
                  ? "/images/ui/nav/icon-bookmark-filled.svg"
                  : "/images/ui/nav/icon-save-outline.svg"
              }
            />
          </button>
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            type="button"
            aria-label="Share artwork"
            onClick={handleShare}
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/nav/icon-share.svg"
            />
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
