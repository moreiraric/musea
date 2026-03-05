import type { ReactNode } from "react";
import { ImageWithFallback } from "@/components/image-with-fallback";

const brokenImageIconSrc = "/images/ui/other/image-broken.svg";

type ArtworkFrameSmallProps = {
  imageUrl?: string | null;
  alt?: string;
  image?: ReactNode;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  className?: string;
};

export function ArtworkFrameSmall({
  imageUrl,
  alt,
  image,
  loading = "lazy",
  decoding = "async",
  className,
}: ArtworkFrameSmallProps) {
  const frameClassName = [
    "flex h-[168.5px] w-[168.5px] shrink-0 flex-col items-center justify-center bg-[#f5f5f5] p-[20px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClassName}>
      {image ? (
        image
      ) : imageUrl ? (
        <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={alt ?? ""}
            className="block h-full w-full object-contain"
            loading={loading}
            decoding={decoding}
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
