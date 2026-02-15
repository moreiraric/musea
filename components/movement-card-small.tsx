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
    "flex h-[96px] w-[330px] items-center gap-[4px] rounded-[24px] border border-[#d9d9d9] bg-white pl-[8px] pr-[16px] py-[16px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img alt={name} className="h-full w-full object-cover" src={imageUrl} />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col items-start justify-between text-center">
        <p className="text-header-content-h2 text-[#1e1e1e]">
          {name}
        </p>
        {normalizedYears ? (
          <div className="text-body-default-mono flex items-center gap-[4px] text-[#757575]">
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
