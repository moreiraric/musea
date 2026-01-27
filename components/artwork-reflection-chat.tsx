"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ArtworkReflectionChatProps = {
  question: string;
  artworkTitle: string;
};

export function ArtworkReflectionChat({ question, artworkTitle }: ArtworkReflectionChatProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsActive(false);
    window.setTimeout(() => setIsOpen(false), 260);
  };

  if (!question) {
    return null;
  }

  return (
    <>
      <div className="rounded-full p-[1px] shadow-[0px_1px_10px_rgba(4,98,153,0.15),0px_-1px_10px_rgba(221,98,249,0.15)]"
        style={{
          background:
            "linear-gradient(95deg, #0296ED 0%, #F9A8D4 42%, #C287DE 100%)",
        }}
      >
        <button
          className="flex w-full items-center rounded-full bg-[#f5f5f5] px-[20px] py-[16px] text-left"
          type="button"
          onClick={handleOpen}
        >
          <span className="text-[16px] text-[#707070] [font-family:var(--font-instrument-sans)]">
            {question}
          </span>
        </button>
      </div>

      {isOpen && portalTarget
        ? createPortal(
            <div className="absolute inset-0 z-40">
              <button
                type="button"
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                aria-label="Close conversation"
                onClick={handleClose}
              />
              <div
                className={`absolute bottom-0 left-0 right-0 flex h-[92%] flex-col rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.18)] ${
                  isActive
                    ? "sheet-in"
                    : "translate-y-full transition-transform duration-250 ease-in"
                }`}
                style={{
                  willChange: "transform",
                }}
                role="dialog"
                aria-modal="true"
                aria-label={`Conversation about ${artworkTitle}`}
              >
                <div className="flex items-center justify-between px-[20px] pb-[8px] pt-[12px]">
                  <div className="h-[4px] w-[48px] rounded-full bg-[#d9d9d9]" />
                  <button
                    type="button"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#f1f1f1] text-[#1e1e1e]"
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    <span className="text-[18px] leading-none">×</span>
                  </button>
                </div>

                <div className="flex flex-col gap-[6px] px-[20px] pb-[12px]">
                  <p className="text-[18px] font-semibold text-black [font-family:var(--font-literata)]">
                    Talk about this painting
                  </p>
                  <p className="text-[14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                    Ask anything about the artwork or explore its mood, symbolism, and techniques.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-[20px]">
                  <div className="rounded-[20px] border border-[#e5e5e5] bg-[#fafafa] px-[16px] py-[14px]">
                    <p className="text-[14px] uppercase tracking-[0.08em] text-[#9b9b9b] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                      Starter prompt
                    </p>
                    <p className="mt-[8px] text-[16px] text-[#1e1e1e] [font-family:var(--font-literata)]">
                      {question}
                    </p>
                  </div>

                  <div className="mt-[16px] rounded-[20px] border border-dashed border-[#d9d9d9] bg-white px-[16px] py-[16px]">
                    <p className="text-[15px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                      Conversation history will appear here once messages are sent.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#ededed] px-[20px] pb-[20px] pt-[12px]">
                  <div className="flex items-end gap-[10px] rounded-[18px] border border-[#d9d9d9] bg-white px-[12px] py-[10px]">
                    <textarea
                      className="min-h-[56px] flex-1 resize-none bg-transparent text-[16px] text-[#1e1e1e] outline-none [font-family:var(--font-instrument-sans)]"
                      placeholder="Ask about the light, color, or story..."
                      disabled
                    />
                    <button
                      type="button"
                      className="flex h-[36px] items-center justify-center rounded-[12px] bg-[#111111] px-[12px] text-[14px] font-medium text-white opacity-50"
                      disabled
                    >
                      Send
                    </button>
                  </div>
                  <p className="mt-[8px] text-[12px] text-[#9b9b9b] [font-family:var(--font-instrument-sans)]">
                    AI chat is coming soon.
                  </p>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
