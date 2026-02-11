"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export type TabId = "home" | "discover" | "saved";

type TabState = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabPaths: Record<TabId, string>;
  setTabPath: (tab: TabId, path: string) => void;
  recordTabPath: (tab: TabId, path: string) => void;
  goBackInTab: (tab: TabId, fallbackHref?: string) => void;
};

const ACTIVE_TAB_KEY = "art-app-active-tab";
const TAB_PATHS_KEY = "art-app-tab-paths";

const DEFAULT_PATHS: Record<TabId, string> = {
  home: "/",
  discover: "/discover",
  saved: "/saved",
};

type TabHistoryState = {
  entries: string[];
  index: number;
};

const DEFAULT_HISTORY: Record<TabId, TabHistoryState> = {
  home: { entries: [DEFAULT_PATHS.home], index: 0 },
  discover: { entries: [DEFAULT_PATHS.discover], index: 0 },
  saved: { entries: [DEFAULT_PATHS.saved], index: 0 },
};

const TabContext = createContext<TabState | null>(null);
const TabScopeContext = createContext<TabId | null>(null);

function inferTabFromPath(pathname?: string | null) {
  if (pathname?.startsWith("/saved")) {
    return "saved";
  }
  if (
    pathname?.startsWith("/discover") ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/tag") ||
    pathname?.startsWith("/movement") ||
    pathname?.startsWith("/artist")
  ) {
    return "discover";
  }
  return "home";
}

export function TabProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const inferredTab = useMemo(() => inferTabFromPath(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState<TabId>(inferredTab);
  const [tabPaths, setTabPaths] = useState<Record<TabId, string>>(DEFAULT_PATHS);
  const [tabHistory, setTabHistory] =
    useState<Record<TabId, TabHistoryState>>(DEFAULT_HISTORY);
  const skipNextHistory = useRef<Record<TabId, boolean>>({
    home: false,
    discover: false,
    saved: false,
  });

  useEffect(() => {
    try {
      const storedTab = window.localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
      const storedPaths = window.localStorage.getItem(TAB_PATHS_KEY);
      if (storedPaths) {
        const parsed = JSON.parse(storedPaths) as Partial<Record<TabId, string>>;
        setTabPaths((prev) => ({ ...prev, ...parsed }));
      }
      if (storedTab === "home" || storedTab === "discover" || storedTab === "saved") {
        const isRootPath =
          pathname === "/" ||
          pathname?.startsWith("/discover") ||
          pathname?.startsWith("/search") ||
          pathname?.startsWith("/saved");
        setActiveTab(isRootPath ? inferredTab : storedTab);
        return;
      }
    } catch {
      // ignore storage errors
    }
    setActiveTab(inferredTab);
  }, [inferredTab, pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch {
      // ignore storage errors
    }
  }, [activeTab]);

  useEffect(() => {
    const viewport = document.getElementById("app-viewport");
    if (viewport) {
      viewport.setAttribute("data-active-tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_PATHS_KEY, JSON.stringify(tabPaths));
    } catch {
      // ignore storage errors
    }
  }, [tabPaths]);

  useEffect(() => {
    const viewport = document.getElementById("app-viewport");
    viewport?.removeAttribute("data-overlay-open");
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      tabPaths,
      setTabPath: (tab: TabId, path: string) => {
        setTabPaths((prev) => (prev[tab] === path ? prev : { ...prev, [tab]: path }));
      },
      recordTabPath: (tab: TabId, path: string) => {
        setTabHistory((prev) => {
          const state = prev[tab] ?? DEFAULT_HISTORY[tab];
          if (skipNextHistory.current[tab]) {
            skipNextHistory.current[tab] = false;
            return prev;
          }
          const current = state.entries[state.index];
          if (current === path) {
            return prev;
          }
          const existingIndex = state.entries.indexOf(path);
          if (existingIndex !== -1) {
            return { ...prev, [tab]: { ...state, index: existingIndex } };
          }
          const nextEntries = [...state.entries.slice(0, state.index + 1), path];
          return { ...prev, [tab]: { entries: nextEntries, index: nextEntries.length - 1 } };
        });
      },
      goBackInTab: (tab: TabId, fallbackHref?: string) => {
        const state = tabHistory[tab] ?? DEFAULT_HISTORY[tab];
        const fallback = fallbackHref ?? DEFAULT_PATHS[tab];
        if (state.index <= 0) {
          skipNextHistory.current[tab] = true;
          setTabHistory((prev) => ({
            ...prev,
            [tab]: { entries: [fallback], index: 0 },
          }));
          router.replace(fallback);
          return;
        }
        const nextIndex = state.index - 1;
        const target = state.entries[nextIndex] ?? fallback;
        skipNextHistory.current[tab] = true;
        setTabHistory((prev) => ({
          ...prev,
          [tab]: { ...state, index: nextIndex },
        }));
        router.replace(target);
      },
    }),
    [activeTab, tabHistory, tabPaths, router],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTabState() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error("useTabState must be used within TabProvider");
  }
  return ctx;
}

export function TabScopeProvider({
  tabId,
  children,
}: {
  tabId: TabId;
  children: ReactNode;
}) {
  return <TabScopeContext.Provider value={tabId}>{children}</TabScopeContext.Provider>;
}

export function useTabScope() {
  const scope = useContext(TabScopeContext);
  const { activeTab } = useTabState();
  return scope ?? activeTab;
}
