import Link from "next/link";

type ArtistPortraitProps = {
  name: string;
  imageUrl?: string | null;
  href?: string | null;
  showName?: boolean;
};

function formatSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return fullName;
  }
  const remainder = parts.slice(1).join(" ");
  if (!remainder) {
    return fullName;
  }
  const firstChar = remainder[0];
  return firstChar && firstChar === firstChar.toLowerCase()
    ? `${firstChar.toUpperCase()}${remainder.slice(1)}`
    : remainder;
}

export function ArtistPortrait({
  name,
  imageUrl,
  href,
  showName = true,
}: ArtistPortraitProps) {
  const content = (
    <>
      <div className="relative h-[100px] w-[67px] shrink-0">
        <div className="absolute inset-0 overflow-hidden rounded-[1000px] border-2 border-white bg-[#b3b3b3]">
          {imageUrl ? (
            <img alt={name} className="h-full w-full object-cover" src={imageUrl} />
          ) : null}
        </div>
      </div>
      {showName ? (
        <p className="text-header-content-h3 whitespace-nowrap text-black">
          {formatSurname(name)}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className="flex min-w-[80px] flex-col items-center justify-center gap-[4px]" href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div className="flex min-w-[80px] flex-col items-center justify-center gap-[4px]">
      {content}
    </div>
  );
}
