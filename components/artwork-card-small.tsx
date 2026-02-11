import { ArtworkFrameSmall } from "@/components/artwork-frame-small";

type ArtworkCardSmallProps = {
  title: string;
  artistName?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  showArtistName?: boolean;
};

export function ArtworkCardSmall({
  title,
  artistName,
  imageUrl,
  imageAlt,
  className,
  loading = "lazy",
  decoding = "async",
  showArtistName = true,
}: ArtworkCardSmallProps) {
  return (
    <div className={className ?? "flex w-[168.5px] flex-col items-start gap-[4px]"}>
      <ArtworkFrameSmall
        className="p-[10px]"
        imageUrl={imageUrl}
        alt={imageAlt ?? title}
        loading={loading}
        decoding={decoding}
      />
      <div className="flex w-full flex-col gap-[4px]">
        <p
          className="text-[16px] font-semibold leading-[24px] text-[#1e1e1e] [font-family:var(--font-literata)]"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {title}
        </p>
        {showArtistName && artistName ? (
          <p className="text-[16px] text-[#757575] tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
            {artistName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
