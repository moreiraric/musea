import Link from "next/link";

type ArtistPortraitAndNameProps = {
  name: string;
  imageUrl?: string | null;
  href?: string | null;
  showName?: boolean;
};

const ARTIST_NAME_WRAP_THRESHOLD = 10;
const ARTIST_NAME_TRUNCATE_LIMIT = 25;

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

function formatArtistNameLabel(fullName: string) {
  const surname = formatSurname(fullName).trim();
  if (surname.length <= ARTIST_NAME_TRUNCATE_LIMIT) {
    return surname;
  }
  return `${surname.slice(0, ARTIST_NAME_TRUNCATE_LIMIT).trimEnd()}…`;
}

export function ArtistPortraitAndName({
  name,
  imageUrl,
  href,
  showName = true,
}: ArtistPortraitAndNameProps) {
  const label = formatArtistNameLabel(name);
  const shouldWrap = label.length > ARTIST_NAME_WRAP_THRESHOLD;
  const labelClassName = shouldWrap
    ? "text-header-content-h3 w-full max-w-[80px] overflow-hidden text-center text-black [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] break-words"
    : "text-header-content-h3 w-full whitespace-nowrap text-center text-black";

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
        <p className={labelClassName}>
          {label}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link className="flex w-[80px] shrink-0 self-start flex-col items-start justify-start gap-[4px]" href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div className="flex w-[80px] shrink-0 self-start flex-col items-start justify-start gap-[4px]">
      {content}
    </div>
  );
}

export const ArtistPortrait = ArtistPortraitAndName;
