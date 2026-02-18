"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useTabScope } from "@/components/tab-state";

export function HomeTopBar() {
  const tabId = useTabScope();
  const portalTarget =
    typeof document === "undefined"
      ? null
      : document.getElementById("app-viewport");

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      data-tab={tabId}
      className="tab-portal pointer-events-none absolute left-0 top-0 z-30 w-full"
    >
      <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] px-[20px] pb-[8px] pt-[54px]">
        <div className="flex w-full items-center justify-end">
          <Link
            href="/profile"
            className="pointer-events-auto flex h-[40px] items-center rounded-full bg-[rgba(255,255,255,0.33)] px-[8px] py-[6px] shadow-[0px_0px_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
            aria-label="Open profile"
          >
            <img
              alt=""
              aria-hidden="true"
              className="h-[24px] w-[24px]"
              src="/images/ui/other/icon-user-outline.svg"
            />
          </Link>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
