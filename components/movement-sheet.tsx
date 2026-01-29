"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArtworkFull } from "@/components/artwork-full";
import { ArtworkFrameSmall } from "@/components/artwork-frame-small";

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
};

type MovementArtwork = {
  id: string;
  title: string;
  imageUrl?: string | null;
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
        className={`text-[14px] font-medium tracking-[-0.14px] text-center whitespace-nowrap [font-family:var(--font-instrument-sans)] ${
          isActive ? "text-[#757575]" : "text-black"
        }`}
        style={{ fontVariationSettings: "'wdth' 100" }}
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

function MovementEssaySection({ title, body, artwork }: MovementEssay) {
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <div className="flex w-full flex-col gap-[4px] px-[20px]">
        <p className="text-[20px] font-semibold leading-[28px] text-black [font-family:var(--font-literata)]">
          {title}
        </p>
        <p className="text-[18px] leading-[26px] text-black [font-family:var(--font-literata)]">
          {body}
        </p>
      </div>
      <ArtworkFull
        className="w-full"
        frameClassName="w-full"
        title={artwork?.title ?? "Artwork Title"}
        year={artwork?.year ?? "0000"}
        imageUrl={artwork?.imageUrl ?? null}
        artist={
          artwork?.artist ?? {
            name: "Artist Name",
            imageUrl: null,
            href: null,
          }
        }
      />
    </div>
  );
}

function ArtistPortrait({ name, imageUrl }: MovementArtist) {
  return (
    <div className="flex w-[100px] flex-col items-center justify-center gap-[8px]">
      <div className="h-[150px] w-[100px] overflow-hidden rounded-full bg-[#d9d9d9]">
        {imageUrl ? (
          <img alt={name} className="h-full w-full object-cover" src={imageUrl} />
        ) : null}
      </div>
      <p className="text-[16px] text-black [font-family:var(--font-inter)]">
        {name}
      </p>
    </div>
  );
}

export function MovementSheet({
  movement,
  trigger,
  timeline,
  essays,
  artists,
  artworks,
}: MovementSheetProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const activeChipRef = useRef<HTMLDivElement | null>(null);
  const movementYears = formatMovementYears(movement.startYear, movement.endYear);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, resolvedTimeline]);

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

  const handleTriggerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest("[data-movement-sheet-ignore]")) {
        return;
      }
    }
    setIsOpen(true);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
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
          className={`absolute inset-0 z-40 transition-opacity duration-300 ${
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onWheel={(event) => {
            if (isOpen) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onTouchMove={(event) => {
            if (isOpen) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          aria-hidden={!isOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close movement details"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`absolute bottom-0 left-0 right-0 flex h-[92%] flex-col overflow-hidden rounded-t-[36px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.18)] transition-transform duration-500 ease-out ${
              isOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ willChange: "transform" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Movement details for ${movement.name}`}
          >
            <div className="relative flex h-full flex-col">
              <div className="pointer-events-none absolute left-1/2 top-[8px] h-[4px] w-[48px] -translate-x-1/2 rounded-full bg-[#d9d9d9]" />
              <div className="pointer-events-none absolute left-0 right-0 top-0 h-[24px] bg-gradient-to-t from-transparent to-white/90" />
              <div className="flex-1 overflow-y-auto pb-[24px] pt-[24px]">
                <div className="flex flex-col items-center gap-[16px] pb-[32px]">
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
                    <div className="flex flex-col items-center gap-[4px]">
                      <p className="text-[20px] font-semibold text-[#1e1e1e] [font-family:var(--font-literata)]">
                        {movement.name}
                      </p>
                      {movementYears ? (
                        <div className="flex items-center gap-[4px] text-[16px] font-normal text-[#757575] tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
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
                    {resolvedTimeline.map((item) => (
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

                <section className="flex w-full flex-col gap-[8px] overflow-hidden py-[32px]">
                  <div className="flex w-full items-center px-[20px]">
                    <p className="text-[14px] font-semibold uppercase tracking-[-0.42px] text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                      About
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-[64px]">
                    {resolvedEssays.map((essay) => (
                      <MovementEssaySection key={essay.id} {...essay} />
                    ))}
                  </div>
                </section>

                <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
                  <div className="flex items-end py-[8px]">
                    <p className="text-[20px] font-semibold text-black [font-family:var(--font-instrument-sans)]">
                      Artists
                    </p>
                  </div>
                  <div className="flex items-center gap-[16px] overflow-x-auto pb-[4px] hide-scrollbar">
                    {resolvedArtists.map((artist) => (
                      <ArtistPortrait key={artist.id} {...artist} />
                    ))}
                  </div>
                </section>

                <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
                  <div className="flex items-end py-[8px]">
                    <p className="text-[20px] font-semibold text-black [font-family:var(--font-instrument-sans)]">
                      Artworks
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-[16px]">
                    {resolvedArtworks.map((artwork) => (
                      <ArtworkFrameSmall
                        key={artwork.id}
                        imageUrl={artwork.imageUrl ?? null}
                        alt={artwork.title}
                        className="w-full min-h-0 aspect-square"
                      />
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
