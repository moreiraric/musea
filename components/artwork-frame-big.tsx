// Large artwork frame used on detail screens and hero sections.
// It handles custom content, regular images, and a broken-image fallback.

import type { ReactNode } from "react";
import { ImageWithFallback } from "@/components/image-with-fallback";

// === CONSTANTS AND TYPES ===

const brokenImageIconSrc = "/images/ui/other/image-broken.svg";

type ArtworkFrameBigProps = {
  imageUrl?: string | null;
  alt?: string;
  image?: ReactNode;
  className?: string;
};

// Renders a large framed artwork area with graceful fallbacks.
export function ArtworkFrameBig({
  imageUrl,
  alt,
  image,
  className,
}: ArtworkFrameBigProps) {
  const frameClassName = [
    "flex w-full min-h-[393px] max-h-[600px] flex-col items-center justify-center overflow-hidden bg-[#f5f5f5] p-[20px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClassName}>
      {image ? (
        <div className="flex h-full max-h-[560px] w-full items-center justify-center overflow-hidden">
          {image}
        </div>
      ) : imageUrl ? (
        <div className="flex h-full max-h-[560px] w-full items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={alt ?? ""}
            className="block max-h-[560px] w-auto max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex min-h-px min-w-px w-full flex-1 items-center justify-center bg-[#d9d9d9]">
          <img
            alt=""
            aria-hidden="true"
            className="h-[32px] w-[32px] object-contain opacity-70"
            src={brokenImageIconSrc}
          />
        </div>
      )}
    </div>
  );
}
