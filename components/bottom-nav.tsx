"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabId, useTabState } from "@/components/tab-state";

type NavIconName = "home" | "discover" | "saved";

const navItems: Array<{
  id: TabId;
  label: string;
  href: string;
  icon: NavIconName;
}> = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: "home",
  },
  {
    id: "discover",
    label: "Discover",
    href: "/discover",
    icon: "discover",
  },
  {
    id: "saved",
    label: "Saved",
    href: "/saved",
    icon: "saved",
  },
];

function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  if (name === "home") {
    return (
      <svg
        aria-hidden="true"
        className={className ?? "h-[24px] w-[24px]"}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 11.2498V20.2498C21 20.4487 20.921 20.6395 20.7803 20.7801C20.6397 20.9208 20.4489 20.9998 20.25 20.9998H15C14.8011 20.9998 14.6103 20.9208 14.4697 20.7801C14.329 20.6395 14.25 20.4487 14.25 20.2498V15.3748C14.25 15.2753 14.2105 15.18 14.1402 15.1096C14.0698 15.0393 13.9745 14.9998 13.875 14.9998H10.125C10.0255 14.9998 9.93016 15.0393 9.85983 15.1096C9.78951 15.18 9.75 15.2753 9.75 15.3748V20.2498C9.75 20.4487 9.67098 20.6395 9.53033 20.7801C9.38968 20.9208 9.19891 20.9998 9 20.9998H3.75C3.55109 20.9998 3.36032 20.9208 3.21967 20.7801C3.07902 20.6395 3 20.4487 3 20.2498V11.2498C3.00018 10.852 3.15834 10.4706 3.43969 10.1895L10.9397 2.68948C11.221 2.40839 11.6023 2.25049 12 2.25049C12.3977 2.25049 12.779 2.40839 13.0603 2.68948L20.5603 10.1895C20.8417 10.4706 20.9998 10.852 21 11.2498Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "discover") {
    return (
      <svg
        aria-hidden="true"
        className={className ?? "h-[24px] w-[24px]"}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.1992 2.01682C10.2708 2.01682 8.38573 2.58864 6.78235 3.65999C5.17897 4.73133 3.92929 6.25407 3.19134 8.03565C2.45338 9.81723 2.2603 11.7776 2.63651 13.6689C3.01271 15.5603 3.94131 17.2975 5.30487 18.6611C6.66843 20.0247 8.40572 20.9533 10.297 21.3295C12.1883 21.7057 14.1487 21.5126 15.9303 20.7746C17.7119 20.0367 19.2346 18.787 20.306 17.1836C21.3773 15.5802 21.9492 13.6952 21.9492 11.7668C21.9464 9.18179 20.9183 6.70343 19.0904 4.87554C17.2625 3.04765 14.7842 2.01955 12.1992 2.01682ZM17.0348 7.43463L14.0348 13.4346C13.9981 13.5069 13.9393 13.5657 13.867 13.6024L7.86697 16.6024C7.79654 16.6378 7.71674 16.6501 7.63891 16.6376C7.56109 16.625 7.4892 16.5883 7.43346 16.5325C7.37772 16.4768 7.34096 16.4049 7.32841 16.3271C7.31586 16.2492 7.32815 16.1694 7.36354 16.099L10.3635 10.099C10.4003 10.0267 10.459 9.96792 10.5313 9.93119L16.5314 6.93119C16.6018 6.8958 16.6816 6.88351 16.7594 6.89606C16.8372 6.90861 16.9091 6.94537 16.9649 7.00111C17.0206 7.05685 17.0574 7.12874 17.0699 7.20656C17.0825 7.28439 17.0702 7.36419 17.0348 7.43463Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-[24px] w-[24px]"}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 5.25H6C5.60218 5.25 5.22064 5.40804 4.93934 5.68934C4.65804 5.97064 4.5 6.35218 4.5 6.75V21C4.5 21.1378 4.53796 21.2729 4.60972 21.3906C4.68149 21.5082 4.78428 21.6038 4.90681 21.6669C5.02934 21.7299 5.16688 21.758 5.30432 21.748C5.44177 21.7381 5.5738 21.6904 5.68594 21.6103L10.5 18.1716L15.315 21.6103C15.4271 21.6901 15.5591 21.7376 15.6964 21.7474C15.8337 21.7573 15.971 21.7291 16.0934 21.6661C16.2158 21.6031 16.3184 21.5076 16.3902 21.3901C16.4619 21.2726 16.4999 21.1377 16.5 21V6.75C16.5 6.35218 16.342 5.97064 16.0607 5.68934C15.7794 5.40804 15.3978 5.25 15 5.25Z"
        fill="currentColor"
      />
      <path
        d="M18 2.25H8.25C8.05109 2.25 7.86032 2.32902 7.71967 2.46967C7.57902 2.61032 7.5 2.80109 7.5 3C7.5 3.19891 7.57902 3.38968 7.71967 3.53033C7.86032 3.67098 8.05109 3.75 8.25 3.75H18V18C18 18.1989 18.079 18.3897 18.2197 18.5303C18.3603 18.671 18.5511 18.75 18.75 18.75C18.9489 18.75 19.1397 18.671 19.2803 18.5303C19.421 18.3897 19.5 18.1989 19.5 18V3.75C19.5 3.35218 19.342 2.97064 19.0607 2.68934C18.7794 2.40804 18.3978 2.25 18 2.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DefaultNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab, setTabPath, tabPaths, setPendingSwitch } =
    useTabState();
  const activeIndex = navItems.findIndex((item) => item.id === activeTab);
  const clampedIndex = activeIndex === -1 ? 0 : activeIndex;
  const fullPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  return (
    <div className="flex h-full items-end gap-[10px]">
      <div
        className="relative flex flex-1 items-center rounded-full border border-white px-[6px] py-[4px] shadow-[0_0_32px_rgba(0,0,0,0.1)] backdrop-blur-[16px]"
        style={{ backgroundColor: "rgba(255,255,255,0.66)" }}
      >
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

          const iconColor = isActive ? "text-[#1e1e1e]" : "text-[#757575]";
          const labelColor = isActive ? "text-[#303030]" : "text-[#5a5a5a]";

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => {
                const isActiveTab = item.id === activeTab;
                if (isActiveTab) {
                  event.preventDefault();
                  if (fullPath !== item.href) {
                    router.replace(item.href);
                  }
                  return;
                }
                setActiveTab(item.id);
                const target = tabPaths[item.id] ?? item.href;
                setPendingSwitch({ tab: item.id, path: target });
                event.preventDefault();
                router.replace(target);
              }}
              className={[
                "relative z-10 flex flex-1 flex-col items-center justify-center gap-[4px] rounded-full px-[16px] py-[8px] text-center text-[12px] font-semibold tracking-[0.36px] transition",
              ].join(" ")}
            >
              <NavIcon className={`h-[24px] w-[24px] ${iconColor}`} name={item.icon} />
              <span className={labelColor}>{item.label}</span>
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
