import Link from "next/link";

type MovementCardSmallProps = {
  name: string;
  years?: string | null;
  imageUrl?: string | null;
  href?: string;
  className?: string;
  fallbackYears?: string;
  compact?: boolean;
  desaturateImage?: boolean;
};

export function MovementCardSmall({
  name,
  years,
  imageUrl,
  href,
  className,
  fallbackYears,
  compact = false,
  desaturateImage = false,
}: MovementCardSmallProps) {
  const resolvedYears = years && years.trim().length > 0 ? years : fallbackYears;
  const normalizedYears = resolvedYears
    ? resolvedYears.replace(/\s*-\s*/g, "-")
    : "";
  const normalizedYearParts = normalizedYears
    ? normalizedYears.split("-").map((part) => part.trim())
    : [];
  const hasYearRange =
    normalizedYearParts.length === 2 && normalizedYearParts[0] && normalizedYearParts[1];
  const cardClassName = [
    "flex w-full items-center gap-[8px] rounded-[24px] border border-[#d9d9d9] bg-white pl-[12px] pr-[16px] pb-[12px] pt-[12px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const imageFrameClassName = compact
    ? "flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden"
    : "flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden";
  const imageClassName = compact ? "h-[54px] w-[54px] object-contain" : "h-full w-full object-contain";

  const content = (
    <>
      <div className={imageFrameClassName}>
        {imageUrl ? (
          <img
            alt={name}
            className={imageClassName}
            src={imageUrl}
            style={desaturateImage ? { filter: "grayscale(1) brightness(0.55)" } : undefined}
          />
        ) : null}
      </div>
      <div className="flex h-[59px] min-h-px min-w-0 flex-1 flex-col items-start justify-center gap-[4px]">
        <p className="text-header-content-h3 w-full text-[#1e1e1e]">
          {name}
        </p>
        {normalizedYears ? (
          <div className="text-body-default-mono flex items-center justify-center gap-[4px] text-center text-[#757575]">
            {hasYearRange ? (
              <>
                <span>{normalizedYearParts[0]}</span>
                <span>-</span>
                <span>{normalizedYearParts[1]}</span>
              </>
            ) : (
              normalizedYears
            )}
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link className={cardClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
