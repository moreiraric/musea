"use client";

type AiInputBarProps = {
  label: string;
  onClick: () => void;
};

// Reusable AI input trigger with the artwork-page gradient stroke treatment.
export function AiInputBar({ label, onClick }: AiInputBarProps) {
  return (
    <button
      className="flex w-full items-center gap-[8px] rounded-full px-[20px] py-[16px] text-left shadow-[0px_1px_10px_rgba(4,98,153,0.15),0px_-1px_10px_rgba(221,98,249,0.15)]"
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid transparent",
        background:
          "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(95deg, rgba(2,150,237,0.75) 0%, rgba(241,167,215,0.75) 52%, rgba(194,135,222,0.75) 100%) border-box",
      }}
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-[24px] w-[24px] shrink-0"
        src="/images/ui/other/icoon-sparkle-outline.svg"
      />
      <span className="text-body-default-sans text-[#707070]">
        {label}
      </span>
    </button>
  );
}
