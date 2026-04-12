"use client";

// Tab-aware viewport that caches each root tab's rendered tree.
// It lets home, discover, and saved preserve their own UI state between switches.

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ElasticScroll } from "@/components/elastic-scroll";
import { TabId, TabScopeProvider, useTabState } from "@/components/tab-state";

type CacheEntry = {
  path: string;
  node: ReactNode;
};

const TABS: TabId[] = ["home", "discover", "saved"];

// Renders one live tab while caching the others in memory.
export function TabViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeTab, pendingSwitch, recordTabPath, setPendingSwitch, setTabPath } =
    useTabState();
  const fullPath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const [cache, setCache] = useState<Record<TabId, CacheEntry | null>>({
    home: null,
    discover: null,
    saved: null,
  });
  const lastTabRef = useRef<TabId>(activeTab);
  const lastPathRef = useRef<string>(fullPath);
  const isTabSwitchWithoutNav =
    lastTabRef.current !== activeTab && lastPathRef.current === fullPath;
  const pendingMismatch =
    pendingSwitch &&
    (pendingSwitch.tab !== activeTab || pendingSwitch.path !== fullPath);

  useEffect(() => {
    if (pendingMismatch) {
      return;
    }
    if (
      pendingSwitch &&
      pendingSwitch.tab === activeTab &&
      pendingSwitch.path === fullPath
    ) {
      setPendingSwitch(null);
    }
    setTabPath(activeTab, fullPath);
    recordTabPath(activeTab, fullPath);
    // Cache the current route tree so returning to the tab restores the same UI.
    setCache((prev) => {
      const current = prev[activeTab];
      if (!current || current.path !== fullPath) {
        return { ...prev, [activeTab]: { path: fullPath, node: children } };
      }
      return prev;
    });
    lastTabRef.current = activeTab;
    lastPathRef.current = fullPath;
  }, [
    activeTab,
    children,
    fullPath,
    isTabSwitchWithoutNav,
    pendingMismatch,
    pendingSwitch,
    recordTabPath,
    setPendingSwitch,
    setTabPath,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {TABS.map((tab) => {
        const isActive = tab === activeTab;
        const entry = cache[tab];
        // During a tab switch, keep showing the cached tree until navigation catches up.
        const showLive =
          isActive && (!entry || entry.path !== fullPath) && !isTabSwitchWithoutNav;
        const node = showLive
          ? children
          : isActive && isTabSwitchWithoutNav
            ? entry?.node ?? children
            : entry?.node ?? null;

        return (
          <div
            key={tab}
            aria-hidden={!isActive}
            className={isActive ? "flex min-h-0 flex-1 flex-col" : "hidden"}
          >
            <ElasticScroll>
              <TabScopeProvider tabId={tab}>{node}</TabScopeProvider>
            </ElasticScroll>
          </div>
        );
      })}
    </div>
  );
}
