type MovementCardBigProps = {
  name: string;
  years?: string | null;
  summary?: string | null;
  imageUrl?: string | null;
  className?: string;
};

export function MovementCardBig({
  name,
  years,
  summary,
  imageUrl,
  className,
}: MovementCardBigProps) {
  const containerClassName = [
    "flex w-full flex-col items-center rounded-[32px] border border-[#d9d9d9] bg-white px-[20px] pb-[30px] pt-[20px] text-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="flex w-full flex-col items-center">
        <div className="flex items-center justify-center">
          <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                alt={name}
                className="h-full w-full object-contain"
                src={imageUrl}
              />
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-[8px]">
          <div className="flex w-full flex-col items-center gap-[8px]">
            <p className="text-header-content-h2 text-[#1e1e1e]">
              {name}
            </p>
            {years ? (
              <div className="text-body-default-mono flex items-center justify-center gap-[4px] text-[#757575]">
                {years}
              </div>
            ) : null}
          </div>
          {summary ? (
            <p className="text-body-default-serif leading-[26px] text-[#1e1e1e]">
              {summary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
