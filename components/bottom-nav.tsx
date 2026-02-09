"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
];

function DefaultNav() {
  const pathname = usePathname();
  const activeIndex = navItems.findIndex((item) =>
    item.href === "/"
      ? pathname === "/" || pathname?.startsWith("/artwork")
      : pathname?.startsWith(item.href),
  );
  const clampedIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="flex h-full items-end gap-[10px]">
      <div className="relative flex flex-1 items-center rounded-full border border-white bg-white/30 px-[6px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]">
          <div
            aria-hidden="true"
            className="absolute inset-y-[4px] left-[6px] z-0 w-1/3 transition-[transform] duration-400 ease-[cubic-bezier(0.22,1.25,0.36,1)] will-change-transform"
            style={{
              width: "calc((100% - 16px) / 3)",
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
                ? pathname === "/" || pathname?.startsWith("/artwork")
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
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

      <Link
        href="/search"
        aria-label="Search"
        className="flex h-[67px] w-[67px] items-center justify-center rounded-full border border-white bg-white/30 px-[6px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
      >
        <img
          alt=""
          aria-hidden="true"
          className="h-[24px] w-[24px]"
          src="/images/ui/nav/icon-search-outline.svg"
        />
      </Link>
    </div>
  );
}

function SearchNav({ isActive }: { isActive: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isActive]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div className="flex h-full items-end gap-[10px]">
      <form
        className="flex flex-1 items-center gap-[8px] rounded-full border border-white bg-white/30 px-[12px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-center py-[8px]">
          <img
            alt=""
            aria-hidden="true"
            className="h-[18px] w-[18px]"
            src="/images/ui/nav/icon-search-outline.svg"
          />
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search artists or artworks..."
          className="flex-1 bg-transparent text-[16px] text-[#1e1e1e] outline-none placeholder:text-[#b3b3b3] [font-family:var(--font-instrument-sans)]"
        />
      </form>
      <button
        type="button"
        aria-label="Close search"
        onClick={handleClose}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white bg-white/30 px-[12px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
      >
        <img
          alt=""
          aria-hidden="true"
          className="h-[24px] w-[24px]"
          src="/images/ui/other/icon-x-outline.svg"
        />
      </button>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isSearch = pathname?.startsWith("/search");

  return (
    <nav className="w-full bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(255,255,255,0.9)] pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto h-[100px] w-full max-w-[393px]">
        <div
          className={`absolute inset-0 px-[20px] pb-[20px] pt-[8px] transition-all duration-300 ${
            isSearch
              ? "pointer-events-none translate-y-[6px] opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <DefaultNav />
        </div>
        <div
          className={`absolute inset-0 px-[20px] pb-[20px] pt-[8px] transition-all duration-300 ${
            isSearch
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-[6px] opacity-0"
          }`}
        >
          <SearchNav isActive={isSearch} />
        </div>
      </div>
    </nav>
  );
}
