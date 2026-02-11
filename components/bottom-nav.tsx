"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TabId, useTabState } from "@/components/tab-state";

const navItems: Array<{
  id: TabId;
  label: string;
  href: string;
  icon: string;
  iconActive: string;
}> = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: "/images/ui/nav/icon-home-outline.svg",
    iconActive: "/images/ui/nav/icon-home-filled.svg",
  },
  {
    id: "discover",
    label: "Discover",
    href: "/search",
    icon: "/images/ui/nav/icon-discover-outline.svg",
    iconActive: "/images/ui/nav/icon-discover-filled.svg",
  },
  {
    id: "saved",
    label: "Saved",
    href: "/saved",
    icon: "/images/ui/nav/icon-bookmark-outline.svg",
    iconActive: "/images/ui/nav/icon-bookmarked-filled.svg",
  },
];

function DefaultNav() {
  const router = useRouter();
  const { activeTab, setActiveTab, tabPaths } = useTabState();
  const activeIndex = navItems.findIndex((item) => item.id === activeTab);
  const clampedIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="flex h-full items-end gap-[10px]">
      <div className="relative flex flex-1 items-center rounded-full border border-white bg-white/30 px-[6px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]">
        <div
          aria-hidden="true"
          className="absolute inset-y-[4px] left-[6px] z-0 transition-[transform] duration-400 ease-[cubic-bezier(0.22,1.25,0.36,1)] will-change-transform"
          style={{
            width: "calc((100% - 12px) / 3)",
            transform: `translateX(calc(${clampedIndex} * 100%))`,
          }}
        >
          <div
            key={clampedIndex}
            className="nav-pill-scale h-full w-full rounded-full bg-[rgba(205,205,205,0.5)]"
          />
        </div>
        {navItems.map((item, index) => {
          const isActive = activeIndex === -1 ? index === 0 : item.id === activeTab;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => {
                const isDiscover = item.id === "discover";
                const isHome = item.id === "home";
                if (item.id === activeTab && !isDiscover && !isHome) {
                  event.preventDefault();
                  return;
                }
                setActiveTab(item.id);
                const target = isDiscover || isHome ? item.href : tabPaths[item.id] ?? item.href;
                if (target !== item.href) {
                  event.preventDefault();
                  router.push(target);
                }
              }}
              className={[
                "relative z-10 flex flex-1 flex-col items-center justify-center gap-[4px] rounded-full px-[16px] py-[8px] text-center text-[12px] font-semibold tracking-[0.36px] transition",
                isActive ? "text-[#303030]" : "text-[#5a5a5a] hover:bg-white/40",
              ].join(" ")}
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-[24px] w-[24px]"
                src={isActive ? item.iconActive : item.icon}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav className="w-full bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto h-[100px] w-[275px]">
        <div className="absolute inset-0 pb-[20px] pt-[8px]">
          <DefaultNav />
        </div>
      </div>
    </nav>
  );
}
