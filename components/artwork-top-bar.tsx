"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ArtworkTopBarProps = {
  artwork: {
    id: string;
    slug: string | null;
    title: string;
    image_url: string | null;
  };
};

const STORAGE_KEY = "savedArtworks";

export function ArtworkTopBar({ artwork }: ArtworkTopBarProps) {
  const router = useRouter();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  if (!portalTarget) {
    return null;
  }

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
      if (!exists) {
        list.unshift({
          id: artwork.id,
          slug: artwork.slug,
          title: artwork.title,
          image_url: artwork.image_url ?? null,
        });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore storage errors
    }
  };

  return createPortal(
    <div className="absolute left-0 top-0 z-30 w-full bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <button
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(217,217,217,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
            type="button"
            onClick={() => router.back()}
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
            className="flex h-[48px] items-center rounded-full bg-[rgba(217,217,217,0.33)] px-[12px] py-[8px] shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
            type="button"
            aria-label="Save artwork"
            onClick={handleSave}
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/nav/icon-save-outline.svg"
            />
          </button>
          <button
            className="flex h-[48px] items-center rounded-full bg-[rgba(217,217,217,0.33)] px-[12px] py-[8px] shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
            type="button"
            aria-label="Share artwork"
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
