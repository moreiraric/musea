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
          className="text-header-content-h3 text-[#1e1e1e]"
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
          <p className="text-body-default-mono text-[#757575]">
            {artistName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
