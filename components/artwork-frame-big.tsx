import type { ReactNode } from "react";

type ArtworkFrameBigProps = {
  imageUrl?: string | null;
  alt?: string;
  image?: ReactNode;
  className?: string;
};

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
        <img
          alt={alt ?? ""}
          className="block max-h-[560px] w-auto max-w-full object-contain"
          src={imageUrl}
        />
      ) : (
        <div className="min-h-px min-w-px w-full flex-1 bg-[#d9d9d9]" />
      )}
    </div>
  );
}
