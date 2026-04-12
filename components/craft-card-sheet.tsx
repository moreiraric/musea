"use client";

// Bottom-sheet overlay opened from artwork craft cards.
// It loads a tag summary and related artworks on demand so the artwork page stays lightweight.

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { useTabScope } from "@/components/tab-state";
import { CraftCard } from "@/components/craft-card";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { LoadingSpinner } from "@/components/loading-spinner";

type CraftCardData = {
  label: string;
  title: string;
  description: string;
  icon: string;
  slug: string;
};

type TagSheetData = {
  tag: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
  };
  bannerArtwork: { slug: string | null; title: string; image_url: string | null } | null;
  artworks: Array<{
    id: string;
    slug: string | null;
    title: string;
    image_url: string | null;
    artists?: { id: string; name: string; slug: string | null; image_url: string | null } | null;
  }>;
};

// Rewrites supported image URLs to thumbnail-friendly variants for the sheet grid.
function getGridImageUrl(url: string, size = 360) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(size));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
    if (parsed.hostname === "upload.wikimedia.org") {
      return url;
    }
  } catch {
    // ignore invalid URLs
  }
  return url;
}

// Renders the craft-card rail and the lazy-loaded tag sheet overlay.
export function CraftCardSheet({ cards }: { cards: CraftCardData[] }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [activeCard, setActiveCard] = useState<CraftCardData | null>(null);
  const [data, setData] = useState<TagSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const tabId = useTabScope();

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  useEffect(() => {
    const viewport = document.getElementById("app-viewport");
    if (!viewport) {
      return;
    }
    if (activeCard) {
      viewport.setAttribute("data-overlay-open", "true");
    } else {
      viewport.removeAttribute("data-overlay-open");
    }
    return () => viewport.removeAttribute("data-overlay-open");
  }, [activeCard]);

  useEffect(() => {
    if (!activeCard) {
      setData(null);
      setErrorMessage("");
      return;
    }
    const controller = new AbortController();
    // Load the selected tag only when its sheet is opened.
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch(
          `/api/tag-sheet?slug=${encodeURIComponent(activeCard.slug)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Unable to load tag.");
        }
        const payload = (await response.json()) as TagSheetData;
        setData(payload);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setErrorMessage("Unable to load this tag right now.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [activeCard]);

  const bannerImageUrl = useMemo(() => {
    if (!data) {
      return "";
    }
    // Fall back to the first artwork image when the tag has no explicit banner.
    const fallback = data.artworks.find((artwork) => Boolean(artwork.image_url));
    return data.bannerArtwork?.image_url ?? fallback?.image_url ?? "";
  }, [data]);

  const closeSheet = () => setActiveCard(null);

  return (
    <>
      <HorizontalDragScroll className="-mx-[20px] flex w-[calc(100%+40px)] gap-[16px] overflow-x-auto py-[2px] pl-[20px] pr-[20px] hide-scrollbar">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setActiveCard(card)}
            className="text-left"
          >
            <CraftCard
              label={card.label}
              title={card.title}
              description={card.description}
              icon={card.icon}
            />
          </button>
        ))}
      </HorizontalDragScroll>

      {activeCard && portalTarget
        ? createPortal(
            <div
              data-tab={tabId}
              className="tab-portal absolute inset-0 z-40 transition-opacity duration-300"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close tag sheet"
                onClick={closeSheet}
              />
              <div className="absolute bottom-0 left-0 right-0 flex h-[92%] flex-col overflow-hidden rounded-t-[36px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.18)]">
                <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-[20px] pb-[8px] pt-[20px]">
                  <button
                    type="button"
                    className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.33)] p-[8px] shadow-[0px_0px_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
                    aria-label="Close tag sheet"
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

                <div className="flex-1 overflow-y-auto pb-[32px]">
                  {isLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <LoadingSpinner size={44} />
                    </div>
                  ) : errorMessage ? (
                    <div className="flex w-full flex-col items-center gap-[12px] px-[20px] py-[24px] text-center">
                      <p className="text-[16px] text-[#757575] [font-family:var(--font-inter)]">
                        {errorMessage}
                      </p>
                    </div>
                  ) : data ? (
                    <>
                      <section className="flex w-full flex-col">
                        <div className="flex h-[200px] w-full items-center justify-center bg-[#f5f5f5]">
                          {bannerImageUrl ? (
                            <img
                              alt={data.bannerArtwork?.title ?? data.tag.name}
                              className="h-full w-full object-cover"
                              src={bannerImageUrl}
                            />
                          ) : (
                            <p className="text-[16px] text-black [font-family:var(--font-inter)]">
                              {data.tag.name}
                            </p>
                          )}
                        </div>
                      </section>

                      <div className="flex w-full flex-col items-start px-[20px]">
                        <section className="flex w-full flex-col gap-[10px] pb-[20px] pt-[20px]">
                          <p className="capitalize text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
                            {data.tag.name}
                          </p>
                          <div className="flex w-full items-center">
                            <p className="text-[16px] leading-[24px] text-[#5a5a5a] [font-family:var(--font-instrument-sans)]">
                              {data.tag.description ?? ""}
                            </p>
                          </div>
                        </section>

                        <section className="flex w-full flex-col items-start justify-center pb-[32px]">
                          <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[28px]">
                            {data.artworks.length > 0 ? (
                              data.artworks.map((artwork) => (
                                <Link
                                  key={artwork.id}
                                  className="flex w-full justify-start"
                                  href={`/artwork/${artwork.slug ?? artwork.id}`}
                                  onClick={closeSheet}
                                >
                                  <ArtworkCardSmall
                                    title={artwork.title}
                                    artistName={artwork.artists?.name ?? "Unknown artist"}
                                    imageUrl={
                                      artwork.image_url
                                        ? getGridImageUrl(artwork.image_url)
                                        : null
                                    }
                                    imageAlt={artwork.title}
                                  />
                                </Link>
                              ))
                            ) : (
                              <div className="col-span-2 flex w-full flex-col items-center gap-[12px] py-[24px] text-center">
                                <p className="text-[16px] text-[#757575] [font-family:var(--font-inter)]">
                                  No results match this tag.
                                </p>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
