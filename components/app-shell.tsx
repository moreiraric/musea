"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { TabProvider } from "@/components/tab-state";
import { TabViewport } from "@/components/tab-viewport";
import { TapCursor } from "@/components/tap-cursor";

type AppShellProps = {
  children: ReactNode;
};

const PHONE_WIDTH = 402;
const PHONE_HEIGHT = 874;
const PHONE_MIN_SCALE = 0.8;
const APP_PADDING = 16;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [phoneScale, setPhoneScale] = useState(1);
  const hideTopNav =
    pathname?.startsWith("/artwork/") ||
    pathname?.startsWith("/artist") ||
    pathname?.startsWith("/movement") ||
    pathname === "/" ||
    pathname === "/saved" ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/discover") ||
    pathname?.startsWith("/tag");

  useEffect(() => {
    const updatePhoneScale = () => {
      const availableWidth = Math.max(0, window.innerWidth - APP_PADDING * 2);
      const availableHeight = Math.max(0, window.innerHeight - APP_PADDING * 2);
      const fitScale = Math.min(
        1,
        availableWidth / PHONE_WIDTH,
        availableHeight / PHONE_HEIGHT,
      );
      const clampedScale = Math.max(PHONE_MIN_SCALE, fitScale);
      setPhoneScale((previousScale) =>
        Math.abs(previousScale - clampedScale) < 0.001
          ? previousScale
          : clampedScale,
      );
    };

    updatePhoneScale();
    window.addEventListener("resize", updatePhoneScale);
    return () => {
      window.removeEventListener("resize", updatePhoneScale);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#f2f2f2,_#e6e3dd)] p-4 text-foreground">
      <div
        className="relative mx-auto"
        style={{
          width: `${PHONE_WIDTH * phoneScale}px`,
          height: `${PHONE_HEIGHT * phoneScale}px`,
        }}
      >
        <div
          className="relative h-[874px] w-[402px] rounded-[72px] border border-black/10 bg-[#0b0b0b] p-[10px] shadow-[0_25px_60px_-30px_rgba(0,0,0,0.45)]"
          style={{ transform: `scale(${phoneScale})`, transformOrigin: "top left" }}
        >
          <div className="absolute left-1/2 top-[16px] z-40 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-[#050505] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[-4px] top-[130px] h-[64px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div className="absolute left-[-4px] top-[210px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div className="absolute right-[-4px] top-[180px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div
            id="app-viewport"
            className="relative flex h-full cursor-none flex-col overflow-hidden rounded-[60px] bg-background"
          >
            <TabProvider>
              {hideTopNav ? null : <TopNav />}
              <TabViewport>{children}</TabViewport>
              <div className="absolute bottom-0 left-0 right-0">
                <BottomNav />
              </div>
              <TapCursor />
            </TabProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
