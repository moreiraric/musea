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
};

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
}: ArtworkFullProps) {
  return (
    <div className={className ?? "flex flex-col items-start"}>
      <ArtworkFrameBig
        image={image}
        imageUrl={imageUrl}
        alt={imageAlt ?? title}
        className={frameClassName}
      />
      <div className="flex w-full flex-col gap-[16px] px-[20px] pb-[16px] pt-[8px]">
        <div className="flex items-center">
          <p className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
            {title}
          </p>
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
              <p className="text-[16px] text-[#757575] [font-family:var(--font-jetbrains-mono)]">
                Unknown artist
              </p>
            </div>
          )}
          <p className="text-[16px] text-[#757575] tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
            {year ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
