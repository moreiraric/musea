import Link from "next/link";

type ArtistChipProps = {
  name: string;
  imageUrl?: string | null;
  href?: string | null;
  className?: string;
  disableLink?: boolean;
};

export function ArtistChip({
  name,
  imageUrl,
  href,
  className,
  disableLink = false,
}: ArtistChipProps) {
  const baseClassName = [
    "flex items-center gap-[12px] rounded-full bg-[#f5f5f5] pl-[8px] pr-[16px] py-[8px]",
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
      <p className="text-[16px] text-black tracking-[-0.16px] [font-family:var(--font-fira-mono)]">
        {name}
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
