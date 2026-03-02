import Link from "next/link";

type ArtistChipProps = {
  name: string;
  imageUrl?: string | null;
  href?: string | null;
  className?: string;
  disableLink?: boolean;
};

const MAX_ARTIST_NAME_LENGTH = 20;

function truncateArtistName(name: string) {
  if (name.length <= MAX_ARTIST_NAME_LENGTH) {
    return name;
  }

  return `${name.slice(0, MAX_ARTIST_NAME_LENGTH).trimEnd()}...`;
}

export function ArtistChip({
  name,
  imageUrl,
  href,
  className,
  disableLink = false,
}: ArtistChipProps) {
  const baseClassName = [
    "flex items-center gap-[8px] rounded-full bg-[#f5f5f5] pl-[8px] pr-[16px] py-[8px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="h-[32px] w-[24px] shrink-0 overflow-hidden rounded-full bg-[#d9d9d9]">
        {imageUrl ? (
          <img
            alt={name}
            className="h-full w-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="h-full w-full bg-[#d9d9d9]" />
        )}
      </div>
      <p className="text-body-default-mono text-[#1e1e1e]">
        {truncateArtistName(name)}
      </p>
    </>
  );

  if (href && !disableLink) {
    return (
      <Link className={baseClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}
