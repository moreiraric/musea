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
    "flex w-full max-w-[393px] min-h-[393px] flex-col items-center justify-center bg-[#f5f5f5] p-[20px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClassName}>
      {image ? (
        image
      ) : imageUrl ? (
        <img alt={alt ?? ""} className="block h-auto w-full" src={imageUrl} />
      ) : (
        <div className="min-h-px min-w-px w-full flex-1 bg-[#d9d9d9]" />
      )}
    </div>
  );
}
