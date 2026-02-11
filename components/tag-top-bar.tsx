"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useTabScope } from "@/components/tab-state";

export function TagTopBar({ backHref = "/search" }: { backHref?: string }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const tabId = useTabScope();

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
      <div className="flex h-[100px] w-full items-end bg-gradient-to-t from-[rgba(255,255,255,0)] from-20% to-white px-[20px] pb-[8px]">
        <Link
          href={backHref}
          aria-label="Back"
          className="pointer-events-auto flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-[20px] w-[20px]"
            src="/images/ui/nav/icon-caret-left.svg"
          />
        </Link>
      </div>
    </div>,
    portalTarget,
  );
}
