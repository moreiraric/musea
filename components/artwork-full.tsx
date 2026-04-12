// Full-width artwork presentation block used on home, detail, and sheet surfaces.
// It bundles the frame, title, artist chip, and optional artwork link in one component.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArtworkFrameBig } from "@/components/artwork-frame-big";
import { ArtistChip } from "@/components/artist-chip";

type ArtworkFullProps = {
  title: string;
  year?: number | string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  artist?: {
    name: string;
    imageUrl?: string | null;
    href?: string | null;
  } | null;
  disableArtistLink?: boolean;
  className?: string;
  image?: ReactNode;
  frameClassName?: string;
  artworkHref?: string | null;
};

// Renders a full artwork card with optional image and navigation links.
export function ArtworkFull({
  title,
  year,
  imageUrl,
  imageAlt,
  artist,
  disableArtistLink = false,
  className,
  image,
  frameClassName,
  artworkHref,
}: ArtworkFullProps) {
  // Reuse the same frame markup whether the artwork is clickable or not.
  const frameContent = (
    <ArtworkFrameBig
      image={image}
      imageUrl={imageUrl}
      alt={imageAlt ?? title}
      className={frameClassName}
    />
  );

  return (
    <div className={className ?? "flex flex-col items-start"}>
      {artworkHref ? (
        <Link className="block w-full" href={artworkHref}>
          {frameContent}
        </Link>
      ) : (
        frameContent
      )}
      <div className="flex w-full flex-col gap-[16px] px-[20px] pb-[16px] pt-[8px]">
        <div className="flex items-center">
          {artworkHref ? (
            <Link className="text-header-content-h2 text-black" href={artworkHref}>
              {title}
            </Link>
          ) : (
            <p className="text-header-content-h2 text-black">{title}</p>
          )}
        </div>
        <div className="flex w-full items-center justify-between">
          {artist ? (
            <ArtistChip
              name={artist.name}
              imageUrl={artist.imageUrl}
              href={artist.href}
              disableLink={disableArtistLink}
            />
          ) : (
            <div className="flex items-center rounded-full bg-[#f5f5f5] px-[16px] py-[8px]">
              <p className="text-body-default-mono text-[#757575]">
                Unknown artist
              </p>
            </div>
          )}
          <p className="text-body-default-mono text-[#757575]">
            {year ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
