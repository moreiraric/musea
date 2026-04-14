// Featured artwork card used on the home page.
// It keeps the artwork frame, title, artist chip, and year inside a bordered shell.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArtistChip } from "@/components/artist-chip";
import { ImageWithFallback } from "@/components/image-with-fallback";

type ArtworkCardProps = {
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
  artworkHref?: string | null;
};

export function ArtworkCard({
  title,
  year,
  imageUrl,
  imageAlt,
  artist,
  disableArtistLink = false,
  className,
  image,
  artworkHref,
}: ArtworkCardProps) {
  const cardClassName = [
    "flex w-full flex-col overflow-hidden rounded-[24px] border border-[#d9d9d9]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const frame = (
    <div className="aspect-square w-full overflow-hidden bg-[#f5f5f5]">
      {image ? (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          {image}
        </div>
      ) : imageUrl ? (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={imageAlt ?? title}
            className="block h-full w-full object-cover object-center"
            fallbackClassName="block h-[64px] w-[64px] object-contain opacity-70"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#d9d9d9]">
          <img
            alt=""
            aria-hidden="true"
            className="h-[64px] w-[64px] object-contain opacity-70"
            src="/images/ui/other/image-broken.svg"
          />
        </div>
      )}
    </div>
  );

  const content = (
    <div className="flex w-full flex-col">
      {frame}
      <div className="flex w-full flex-col gap-[16px] px-[20px] pb-[20px] pt-[8px]">
        <div className="flex w-full items-center">
          <p className="text-header-content-h2 text-[#1e1e1e]">{title}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-[12px]">
          {artist ? (
            <ArtistChip
              name={artist.name}
              imageUrl={artist.imageUrl}
              href={artworkHref ? null : artist.href}
              disableLink={disableArtistLink || Boolean(artworkHref)}
              variant="plain"
            />
          ) : (
            <div className="flex items-center px-[16px] py-[8px]">
              <p className="text-body-default-mono text-[#757575]">Unknown artist</p>
            </div>
          )}
          <p className="shrink-0 text-body-default-mono text-[#757575]">
            {year ?? ""}
          </p>
        </div>
      </div>
    </div>
  );

  if (artworkHref) {
    return (
      <Link className={cardClassName} href={artworkHref}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
