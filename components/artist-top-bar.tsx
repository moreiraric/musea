"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTabScope, useTabState } from "@/components/tab-state";

type ArtistTopBarProps = {
  artistId: string;
  artistSlug?: string | null;
  artistName: string;
};

export function ArtistTopBar({ artistId, artistSlug, artistName }: ArtistTopBarProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const tabId = useTabScope();
  const { goBackInTab } = useTabState();

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  if (!portalTarget) {
    return null;
  }

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const shareUrl = `${window.location.origin}/artist/${artistSlug ?? artistId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: artistName,
          url: shareUrl,
        });
      } catch {
        // ignore share cancellations
      }
    }
  };

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal pointer-events-none absolute left-0 top-0 z-30 w-full"
    >
      <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[54px]">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => goBackInTab(tabId, "/discover")}
            aria-label="Back"
            className="pointer-events-auto flex h-[40px] items-center rounded-full bg-[rgba(255,255,255,0.33)] px-[8px] py-[6px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/nav/icon-caret-left.svg"
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share artist"
            className="pointer-events-auto flex h-[40px] items-center rounded-full bg-[rgba(255,255,255,0.33)] px-[8px] py-[6px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
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
