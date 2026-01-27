"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";

type SavedArtwork = {
  id?: string;
  slug?: string;
  title?: string;
  image_url?: string | null;
};

const STORAGE_KEY = "savedArtworks";

export default function SavedPage() {
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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

  return (
    <div className="flex w-full flex-col bg-white">
      {portalTarget
        ? createPortal(
            <div className="absolute left-0 top-0 z-30 w-full bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[51px]">
              <div className="flex w-full items-center justify-end">
                <button
                  type="button"
                  className="flex h-[48px] items-center rounded-full bg-[rgba(217,217,217,0.33)] px-[16px] py-[8px] text-[16px] font-medium text-black shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px] [font-family:var(--font-instrument-sans)]"
                >
                  Edit
                </button>
              </div>
            </div>,
            portalTarget,
          )
        : null}

      <section className="flex w-full flex-col px-[20px] pb-[8px] pt-[107px]">
        <h1 className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
          Saved Artworks
        </h1>
      </section>

      <section className="flex w-full flex-col px-[20px] pb-[32px]">
        {savedArtworks.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-[20px]">
            {savedArtworks.map((artwork, index) => (
              <Link
                key={artwork.id ?? artwork.slug ?? index}
                className="block h-[179px] overflow-hidden bg-[#d9d9d9]"
                href={`/artwork/${artwork.slug ?? artwork.id ?? ""}`}
              >
                {artwork.image_url ? (
                  <img
                    alt={artwork.title ?? "Saved artwork"}
                    className="h-full w-full object-cover"
                    src={artwork.image_url}
                  />
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center py-[125px] text-center">
            <img
              alt=""
              aria-hidden="true"
              className="h-[300px] w-[200px] object-contain"
              src="/images/illustrations/painting.svg"
            />
            <p className="mt-[8px] text-[18px] text-[#757575] [font-family:var(--font-inter)]">
              No saved artworks yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
