"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTabScope, useTabState } from "@/components/tab-state";

type MovementTopBarProps = {
  backHref?: string;
  forceBackHref?: boolean;
};

export function MovementTopBar({
  backHref,
  forceBackHref = false,
}: MovementTopBarProps) {
  const router = useRouter();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const tabId = useTabScope();
  const { goBackInTab } = useTabState();

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal pointer-events-none absolute left-0 top-0 z-30 w-full"
    >
      <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[54px]">
        <button
          type="button"
          onClick={() => {
            if (forceBackHref && backHref) {
              router.push(backHref);
              return;
            }
            goBackInTab(tabId, backHref);
          }}
          aria-label="Back"
          className="pointer-events-auto flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[rgba(217,217,217,0.33)] shadow-[0_0_32px_rgba(0,0,0,0.2)] backdrop-blur-[16px]"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-[24px] w-[24px]"
            src="/images/ui/nav/icon-caret-left.svg"
          />
        </button>
      </div>
    </div>,
    portalTarget,
  );
}
