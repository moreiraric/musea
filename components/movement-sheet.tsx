"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArtistPortrait } from "@/components/artist-portrait";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArtworkFull } from "@/components/artwork-full";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { useTabScope } from "@/components/tab-state";

type MovementSummary = {
  id?: string | null;
  slug?: string | null;
  name: string;
  startYear?: number | null;
  endYear?: number | null;
  iconUrl?: string | null;
};

type MovementTimelineItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
  href?: string;
  isActive?: boolean;
};

type MovementEssay = {
  id: string;
  title: string;
  body: string;
  artwork?: {
    title: string;
    year?: number | string | null;
    imageUrl?: string | null;
    href?: string | null;
    artist?: {
      name: string;
      imageUrl?: string | null;
      href?: string | null;
    } | null;
  };
};

type MovementArtist = {
  id: string;
  name: string;
  imageUrl?: string | null;
  href?: string | null;
};

type MovementArtwork = {
  id: string;
  title: string;
  imageUrl?: string | null;
  href?: string | null;
};

type MovementSheetProps = {
  movement: MovementSummary;
  trigger: ReactNode;
  timeline?: MovementTimelineItem[];
  essays?: MovementEssay[];
  artists?: MovementArtist[];
  artworks?: MovementArtwork[];
};

function formatMovementYears(start?: number | null, end?: number | null) {
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start ? `${start}` : end ? `${end}` : "";
}

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
      <button
        type="button"
        className={chipClassName}
        disabled={isActive}
        aria-current={isActive ? "true" : "false"}
      >
        {content}
      </button>
    );
  }

  return (
    <Link className={chipClassName} href={href}>
      {content}
    </Link>
  );
}

function MovementEssaySection({
  title,
  body,
  artwork,
  onArtworkClick,
}: MovementEssay & { onArtworkClick?: () => void }) {
  const artworkContent = (
    <ArtworkFull
      className="w-full"
      frameClassName="w-full"
      title={artwork?.title ?? "Artwork Title"}
      year={artwork?.year ?? "0000"}
      imageUrl={artwork?.imageUrl ?? null}
      disableArtistLink={Boolean(artwork?.href)}
      artist={
        artwork?.artist ?? {
          name: "Artist Name",
          imageUrl: null,
          href: null,
        }
      }
    />
  );

  return (
    <div className="flex w-full flex-col gap-[16px]">
      <div className="flex w-full flex-col gap-[4px] px-[20px]">
        <p className="text-header-content-h2 text-black">
          {title}
        </p>
        <p className="text-body-longform-serif text-black">
          {body}
        </p>
      </div>
      {artwork?.href ? (
        <Link className="w-full" href={artwork.href} onClick={onArtworkClick}>
          {artworkContent}
        </Link>
      ) : (
        artworkContent
      )}
    </div>
  );
}

function getThumbnailUrl(url?: string | null) {
  if (!url) {
    return null;
  }
  try {
    new URL(url);
    return url;
  } catch {
    return url;
  }
}

export function MovementSheet({
  movement,
  trigger,
  timeline,
  essays,
  artists,
  artworks,
}: MovementSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const activeChipRef = useRef<HTMLDivElement | null>(null);
  const movementYears = formatMovementYears(movement.startYear, movement.endYear);
  const tabId = useTabScope();
  const isSheetOpen = searchParams?.get("movementSheet") === "1";
  const portalTarget =
    typeof document === "undefined" ? null : document.getElementById("app-viewport");
  const sheetPath = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("movementSheet", "1");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const resolvedTimeline = useMemo(() => {
    if (timeline && timeline.length > 0) {
      return timeline;
    }
    return [
      {
        id: "movement-prev-2",
        name: "Prelude",
        iconUrl: movement.iconUrl ?? null,
      },
      {
        id: "movement-prev-1",
        name: "Prior",
        iconUrl: movement.iconUrl ?? null,
      },
      {
        id: movement.id ?? "movement-current",
        name: movement.name,
        iconUrl: movement.iconUrl ?? null,
        isActive: true,
      },
      {
        id: "movement-next-1",
        name: "Next",
        iconUrl: movement.iconUrl ?? null,
      },
      {
        id: "movement-next-2",
        name: "After",
        iconUrl: movement.iconUrl ?? null,
      },
    ];
  }, [movement.iconUrl, movement.id, movement.name, timeline]);

  const timelineWithReturn = useMemo(() => {
    return resolvedTimeline.map((item) => {
      if (!item.href) {
        return item;
      }
      const separator = item.href.includes("?") ? "&" : "?";
      return { ...item, href: `${item.href}${separator}from=${encodeURIComponent(sheetPath)}` };
    });
  }, [resolvedTimeline, sheetPath]);

  useEffect(() => {
    if (!isSheetOpen) {
      return;
    }
    const activeChip = activeChipRef.current;
    const timeline = timelineRef.current;
    if (!activeChip || !timeline) {
      return;
    }
    requestAnimationFrame(() => {
      const timelineRect = timeline.getBoundingClientRect();
      const activeRect = activeChip.getBoundingClientRect();
      const offset =
        activeRect.left -
        timelineRect.left -
        (timelineRect.width / 2 - activeRect.width / 2);
      timeline.scrollTo({
        left: timeline.scrollLeft + offset,
        behavior: "smooth",
      });
    });
  }, [isSheetOpen, resolvedTimeline]);

  const resolvedEssays = useMemo(() => {
    const hasEssayContent = essays?.some(
      (essay) => essay.title.trim() || essay.body.trim(),
    );
    if (essays && hasEssayContent) {
      return essays;
    }
    return [
      {
        id: "movement-essay-1",
        title: "Title",
        body: "This is a paragraph.",
      },
      {
        id: "movement-essay-2",
        title: "Title",
        body: "This is a paragraph.",
      },
      {
        id: "movement-essay-3",
        title: "Title",
        body: "This is a paragraph.",
      },
    ];
  }, [essays]);

  const resolvedArtists = useMemo(() => {
    if (artists && artists.length > 0) {
      return artists;
    }
    return [
      { id: "movement-artist-1", name: "lastname" },
      { id: "movement-artist-2", name: "lastname" },
      { id: "movement-artist-3", name: "lastname" },
      { id: "movement-artist-4", name: "lastname" },
    ];
  }, [artists]);

  const resolvedArtworks = useMemo(() => {
    if (artworks && artworks.length > 0) {
      return artworks;
    }
    return [
      { id: "movement-artwork-1", title: "Artwork" },
      { id: "movement-artwork-2", title: "Artwork" },
      { id: "movement-artwork-3", title: "Artwork" },
      { id: "movement-artwork-4", title: "Artwork" },
    ];
  }, [artworks]);

  const openSheet = useCallback(() => {
    if (!isSheetOpen) {
      const params = new URLSearchParams(searchParams?.toString());
      params.set("movementSheet", "1");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }
  }, [isSheetOpen, pathname, router, searchParams]);

  const closeSheet = useCallback(() => {
    if (isSheetOpen) {
      const params = new URLSearchParams(searchParams?.toString());
      params.delete("movementSheet");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [isSheetOpen, pathname, router, searchParams]);

  useEffect(() => {
    if (!isSheetOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSheet();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSheet, isSheetOpen]);

  const handleTriggerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest("[data-movement-sheet-ignore]")) {
        return;
      }
    }
    openSheet();
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSheet();
    }
  };

  if (!portalTarget) {
    return (
      <div
        className="w-full cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-label="Open movement details"
      >
        {trigger}
      </div>
    );
  }

  return (
    <>
      <div
        className="w-full cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-label="Open movement details"
      >
        {trigger}
      </div>

      {createPortal(
        <div
          data-tab={tabId}
          className={`tab-portal absolute inset-0 z-40 transition-opacity duration-300 ${
            isSheetOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onWheel={(event) => {
            if (isSheetOpen) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onTouchMove={(event) => {
            if (isSheetOpen) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          aria-hidden={!isSheetOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              isSheetOpen ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close movement details"
            onClick={closeSheet}
          />

          <div
            className={`absolute bottom-0 left-0 right-0 flex h-[92%] flex-col overflow-hidden rounded-t-[36px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.18)] transition-transform duration-500 ease-out ${
              isSheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ willChange: "transform" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Movement details for ${movement.name}`}
          >
            <div className="relative flex h-full flex-col">
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-[76px] bg-gradient-to-t from-transparent to-white/90" />
              <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-[20px] pb-[8px] pt-[20px]">
                <button
                  type="button"
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] p-[8px] shadow-[0px_0px_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
                  aria-label="Close movement details"
                  onClick={closeSheet}
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-[24px] w-[24px]"
                    src="/images/ui/other/icon-x-outline.svg"
                  />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pb-[16px] pt-[76px]">
                <div className="flex flex-col items-center gap-[32px] pb-[32px]">
                  <div className="flex flex-col items-center gap-0">
                    <div className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden">
                      {movement.iconUrl ? (
                        <img
                          alt={movement.name}
                          className="h-full w-full object-cover"
                          src={movement.iconUrl}
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col items-center gap-[12px]">
                      <p className="text-header-content-h2 text-[#1e1e1e]">
                        {movement.name}
                      </p>
                      {movementYears ? (
                        <div className="text-meta-large flex items-center gap-[4px] text-[#757575]">
                          {movement.startYear ? <span>{movement.startYear}</span> : null}
                          {movement.startYear && movement.endYear ? <span>-</span> : null}
                          {movement.endYear ? <span>{movement.endYear}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    ref={timelineRef}
                    className="flex w-full items-center gap-[8px] overflow-x-auto px-[20px] pb-[4px] hide-scrollbar"
                  >
                    {timelineWithReturn.map((item) => (
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
                  </div>
                </div>

                <section className="flex w-full flex-col gap-[8px] overflow-hidden pt-0 pb-[32px]">
                  <div className="flex w-full items-center px-[20px]">
                    <p className="text-header-ui-overline text-[#757575]">
                      About
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-0">
                    {resolvedEssays.map((essay) => (
                      <MovementEssaySection key={essay.id} {...essay} />
                    ))}
                  </div>
                </section>

                <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
                  <div className="flex items-end py-[8px]">
                    <p className="text-header-ui-overline text-[#757575]">
                      Artists
                    </p>
                  </div>
                  <div className="-mx-[20px] flex w-[calc(100%+40px)] items-center gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
                    {resolvedArtists.map((artist) => (
                      <ArtistPortrait key={artist.id} {...artist} />
                    ))}
                  </div>
                </section>

                <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
                  <div className="flex items-end py-[8px]">
                    <p className="text-header-ui-overline text-[#757575]">
                      Artworks
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-[20px] gap-y-[30px]">
                    {resolvedArtworks.map((artwork) => (
                      <Link
                        key={artwork.id}
                        href={artwork.href ?? "#"}
                        className={artwork.href ? "block" : "pointer-events-none"}
                      >
                        <ArtworkCardSmall
                          title={artwork.title}
                          imageUrl={getThumbnailUrl(artwork.imageUrl ?? null)}
                          imageAlt={artwork.title}
                          showArtistName={false}
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}
