"use client";

// Outer mobile device shell that wraps the whole app.
// It scales the phone frame to the viewport and mounts shared navigation, tabs, and cursor UI.

import { Suspense, type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { TabProvider } from "@/components/tab-state";
import { TabViewport } from "@/components/tab-viewport";
import { TapCursor } from "@/components/tap-cursor";

type AppShellProps = {
  children: ReactNode;
};

const PHONE_WIDTH = 415;
const PHONE_HEIGHT = 874;
const PHONE_MIN_SCALE = 0.8;
const APP_PADDING = 16;

// Renders the shared simulated phone shell around every route.
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [phoneScale, setPhoneScale] = useState(1);
  // Detail-style screens own their own top controls, so the generic top nav stays hidden there.
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
    // Scale the phone to fit smaller desktop windows while preserving the design ratio.
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
    <div className="min-h-dvh bg-[#F5F5F5] p-4 text-foreground">
      <div
        className="relative mx-auto"
        style={{
          width: `${PHONE_WIDTH * phoneScale}px`,
          height: `${PHONE_HEIGHT * phoneScale}px`,
        }}
      >
        <div
          className="relative cursor-none rounded-[72px] border border-black/10 bg-[#0b0b0b] p-[10px] shadow-[0_25px_60px_-30px_rgba(0,0,0,0.45)]"
          style={{
            width: `${PHONE_WIDTH}px`,
            height: `${PHONE_HEIGHT}px`,
            transform: `scale(${phoneScale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="absolute left-1/2 top-[16px] z-40 h-[34px] w-[120px] -translate-x-1/2 rounded-[20px] bg-[#050505] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[-4px] top-[130px] h-[64px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div className="absolute left-[-4px] top-[210px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div className="absolute right-[-4px] top-[180px] h-[96px] w-[6px] rounded-full bg-[#1a1a1a]" />
          <div
            id="app-viewport"
            className="relative flex h-full flex-col overflow-hidden rounded-[60px] bg-background"
            data-scale={phoneScale}
          >
            <TabProvider>
              {hideTopNav ? null : <TopNav />}
              <Suspense fallback={<div className="flex min-h-0 flex-1 flex-col" />}>
                <TabViewport>{children}</TabViewport>
              </Suspense>
              <div className="absolute bottom-0 left-0 right-0 z-40">
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
              </div>
              <TapCursor />
            </TabProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
