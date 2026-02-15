type CraftCardProps = {
  label: string;
  title: string;
  description: string;
  icon: string;
};

export function CraftCard({ label, title, description, icon }: CraftCardProps) {
  return (
    <article className="flex h-[300px] w-[250px] shrink-0 flex-col justify-between rounded-[16px] border border-[#d9d9d9] bg-white p-[16px]">
      <div className="flex flex-1 flex-col gap-[12px]">
        <div className="flex flex-col gap-[12px]">
          <p className="text-label-primary text-[#757575]">
            {label}
          </p>
          <div className="flex items-center gap-[10px]">
            <img
              alt=""
              aria-hidden="true"
              className="h-[42px] w-[42px] opacity-80"
              src={icon}
            />
            <p className="text-header-content-h2 text-[#1e1e1e]">
              {title}
            </p>
          </div>
        </div>
        <p className="text-body-default-serif text-[#1e1e1e]">
          {description}
        </p>
      </div>
      <div className="flex w-full items-center justify-end p-[2px]">
        <img
          alt=""
          aria-hidden="true"
          className="h-[24px] w-[24px]"
          src="/images/ui/nav/icon-plus.svg"
        />
      </div>
    </article>
  );
}
