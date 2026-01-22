"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: "/images/ui/nav/icon-home-outline.svg",
    iconActive: "/images/ui/nav/icon-home-filled.svg",
  },
  {
    label: "Saved",
    href: "/saved",
    icon: "/images/ui/nav/icon-bookmark-outline.svg",
    iconActive: "/images/ui/nav/icon-bookmarked-filled.svg",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "/images/ui/nav/icon-profile-outline.svg",
    iconActive: "/images/ui/nav/icon-profile-filled.svg",
  },
  {
    label: "Search",
    href: "/search",
    icon: "/images/ui/nav/icon-search-outline.svg",
    iconActive: "/images/ui/nav/icon-search-filled.svg",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href),
  );
  const clampedIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <nav className="w-full bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[100px] max-w-4xl items-start px-[10px] py-[8px]">
        <div className="relative grid w-full flex-1 grid-cols-4 gap-1 rounded-full border border-white/70 bg-white/30 px-[6px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]">
          <div
            aria-hidden="true"
            className="absolute inset-y-[4px] left-[6px] z-0 w-1/4 transition-[transform] duration-400 ease-[cubic-bezier(0.22,1.25,0.36,1)] will-change-transform"
            style={{
              width: "calc((100% - 24px) / 4)",
              transform: `translateX(calc(${clampedIndex} * (100% + 4px)))`,
            }}
          >
            <div
              key={clampedIndex}
              className="nav-pill-scale h-full w-full rounded-full bg-[rgba(205,205,205,0.5)]"
            />
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative z-10 flex min-w-0 flex-col items-center justify-center gap-1 rounded-full px-[12px] py-[8px] text-center text-[12px] font-semibold tracking-[0.36px] transition",
                  isActive
                    ? "text-[#303030]"
                    : "text-[#5a5a5a] hover:bg-white/40",
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
    </nav>
  );
}
