import Link from "next/link";

type MovementCardSmallProps = {
  name: string;
  years?: string | null;
  imageUrl?: string | null;
  href?: string;
  className?: string;
  fallbackYears?: string;
};

export function MovementCardSmall({
  name,
  years,
  imageUrl,
  href,
  className,
  fallbackYears,
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

  const content = (
    <>
      <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img alt={name} className="h-full w-full object-contain" src={imageUrl} />
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
