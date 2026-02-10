"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArtworkCardSmall } from "@/components/artwork-card-small";

type SavedArtwork = {
  id?: string;
  slug?: string;
  title?: string;
  image_url?: string | null;
  artist_name?: string | null;
};

const STORAGE_KEY = "savedArtworks";

export default function SavedPage() {
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const getKey = (artwork: SavedArtwork, index: number) =>
    artwork.id ?? artwork.slug ?? `idx-${index}`;

  const selectedCount = useMemo(() => selectedKeys.size, [selectedKeys]);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedArtworks(parsed);
      }
    } catch {
      // Ignore malformed storage values.
    }
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setSelectedKeys(new Set());
    }
  }, [isEditing]);

  const toggleSelection = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDelete = () => {
    if (selectedKeys.size === 0) {
      return;
    }
    const nextList = savedArtworks.filter((artwork, index) => {
      const key = getKey(artwork, index);
      return !selectedKeys.has(key);
    });
    setSavedArtworks(nextList);
    setSelectedKeys(new Set());
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="flex w-full flex-col bg-white">
      {portalTarget
        ? createPortal(
            <div className="absolute left-0 top-0 z-30 w-full bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]">
              <div className="flex w-full items-center justify-end">
                {isEditing ? (
                  <div className="flex items-center gap-[10px]">
                    <button
                      type="button"
                      className="flex h-[48px] items-center rounded-full bg-[rgba(220,38,38,0.2)] px-[16px] py-[8px] text-[16px] font-medium text-[#dc2626] shadow-[0_0_32px_rgba(220,38,38,0.2)] backdrop-blur-[16px] [font-family:var(--font-instrument-sans)]"
                      onClick={handleDelete}
                      aria-label="Delete selected artworks"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="flex h-[48px] items-center rounded-full bg-[rgba(217,217,217,0.33)] px-[16px] py-[8px] text-[16px] font-medium text-black shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px] [font-family:var(--font-instrument-sans)]"
                      onClick={() => setIsEditing(false)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-[48px] items-center rounded-full bg-[rgba(217,217,217,0.33)] px-[16px] py-[8px] text-[16px] font-medium text-black shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px] [font-family:var(--font-instrument-sans)]"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>,
            portalTarget,
          )
        : null}

      <section className="flex w-full flex-col gap-[16px] px-[20px] pb-[32px] pt-[100px]">
        <h1 className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
          Saved Artworks
        </h1>
        {savedArtworks.length > 0 ? (
          <div className="grid w-full grid-cols-2 justify-items-start gap-[20px]">
            {savedArtworks.map((artwork, index) => {
              const key = getKey(artwork, index);
              const isSelected = selectedKeys.has(key);
              const artistName = artwork.artist_name ?? "Unknown artist";
              const content = (
                <ArtworkCardSmall
                  title={artwork.title ?? "Artwork Title"}
                  artistName={artistName}
                  imageUrl={artwork.image_url}
                  imageAlt={artwork.title ?? "Saved artwork"}
                />
              );

              return (
                <div key={key} className="relative flex w-[168.5px] flex-col items-start">
                  {isEditing ? (
                    <div className="absolute left-[8px] top-[8px] z-10">
                      <img
                        alt=""
                        aria-hidden="true"
                        className="h-[40px] w-[40px]"
                        src={
                          isSelected
                            ? "/images/ui/other/icon-circle-filled.svg"
                            : "/images/ui/other/icon-circle.svg"
                        }
                      />
                    </div>
                  ) : null}
                  {isEditing ? (
                    <div className="pointer-events-none absolute inset-0 z-[5] bg-black/20" />
                  ) : null}
                  {isEditing ? (
                    <button
                      type="button"
                      className="flex w-[168.5px] flex-col items-start"
                      onClick={() => toggleSelection(key)}
                      aria-label={isSelected ? "Deselect artwork" : "Select artwork"}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      className="flex w-[168.5px] flex-col items-start"
                      href={`/artwork/${artwork.slug ?? artwork.id ?? ""}`}
                    >
                      {content}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center py-[125px] text-center">
            <img
              alt=""
              aria-hidden="true"
              className="h-[300px] w-[200px] object-contain"
              src="/images/illustrations/painting.svg"
            />
            <p className="mt-[8px] text-[18px] font-medium text-[#757575] [font-family:var(--font-instrument-sans)]">
              No saved artworks yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
