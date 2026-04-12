"use client";

// Shared tab state for the app shell's home, discover, and saved tabs.
// It tracks per-tab paths and history so tab switches feel like native app navigation.

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

export type TabId = "home" | "discover" | "saved";

// === CONTEXT SHAPES AND CONSTANTS ===

type TabState = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabPaths: Record<TabId, string>;
  setTabPath: (tab: TabId, path: string) => void;
  recordTabPath: (tab: TabId, path: string) => void;
  goBackInTab: (tab: TabId, fallbackHref?: string) => void;
  pendingSwitch: { tab: TabId; path: string } | null;
  setPendingSwitch: (next: { tab: TabId; path: string } | null) => void;
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

const DEBUG_TAB_OVERLAY_DEFAULT = false;

const TabContext = createContext<TabState | null>(null);
const TabScopeContext = createContext<TabId | null>(null);

// Infers which root tab owns the current pathname.
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

// Only returns a tab for true root-level routes that should reset tab history.
function inferTabFromRootPath(pathname?: string | null) {
  if (!pathname) {
    return null;
  }
  if (pathname === "/") {
    return "home";
  }
  if (pathname.startsWith("/discover") || pathname.startsWith("/search")) {
    return "discover";
  }
  if (pathname.startsWith("/saved")) {
    return "saved";
  }
  return null;
}

// Pulls the pathname out of a stored history entry.
function extractPathname(entry: string) {
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    return new URL(entry, base).pathname;
  } catch {
    return entry.split("?")[0] ?? entry;
  }
}

// Removes the synthetic tab query param before persisting a path.
function stripTabParam(entry: string) {
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(entry, base);
    if (!url.searchParams.has("tab")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    url.searchParams.delete("tab");
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  } catch {
    return entry.replace(/([?&])tab=[^&]*(&?)/, (match, leading, trailing) => {
      if (leading === "?" && trailing) {
        return "?";
      }
      return leading === "?" ? "" : leading;
    });
  }
}

// Ensures restored tab paths still belong to the correct root tab.
function sanitizeTabPaths(paths: Partial<Record<TabId, string>>) {
  return (Object.keys(DEFAULT_PATHS) as TabId[]).reduce<Record<TabId, string>>(
    (acc, tab) => {
      const value = paths[tab];
      if (!value) {
        acc[tab] = DEFAULT_PATHS[tab];
        return acc;
      }
      const cleaned = stripTabParam(value);
      const entryTab = inferTabFromRootPath(extractPathname(cleaned));
      acc[tab] = entryTab && entryTab !== tab ? DEFAULT_PATHS[tab] : cleaned;
      return acc;
    },
    { ...DEFAULT_PATHS },
  );
}

// Drops history entries that belong to another root tab.
function sanitizeHistoryState(state: TabHistoryState, tab: TabId): TabHistoryState {
  const kept: string[] = [];
  let nextIndex = 0;
  state.entries.forEach((entry, idx) => {
    const entryTab = inferTabFromRootPath(extractPathname(entry));
    if (entryTab && entryTab !== tab) {
      return;
    }
    kept.push(entry);
    if (idx <= state.index) {
      nextIndex = kept.length - 1;
    }
  });

  if (kept.length === 0) {
    return { entries: [DEFAULT_PATHS[tab]], index: 0 };
  }
  if (nextIndex < 0) {
    nextIndex = 0;
  }
  if (nextIndex >= kept.length) {
    nextIndex = kept.length - 1;
  }
  return { entries: kept, index: nextIndex };
}

// Provides shared tab state, persistence, and debug tools to the app shell.
export function TabProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const inferredTab = useMemo(() => inferTabFromPath(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState<TabId>(inferredTab);
  const [tabPaths, setTabPaths] = useState<Record<TabId, string>>(DEFAULT_PATHS);
  const [tabHistory, setTabHistory] =
    useState<Record<TabId, TabHistoryState>>(DEFAULT_HISTORY);
  const [pendingSwitch, setPendingSwitch] = useState<{ tab: TabId; path: string } | null>(
    null,
  );
  const skipNextHistoryPath = useRef<Record<TabId, string | null>>({
    home: null,
    discover: null,
    saved: null,
  });
  const lastRecordedPath = useRef<Record<TabId, string | null>>({
    home: null,
    discover: null,
    saved: null,
  });
  const [debugEnabled, setDebugEnabled] = useState(DEBUG_TAB_OVERLAY_DEFAULT);
  const [debugEvents, setDebugEvents] = useState<string[]>([]);
  const didInitRef = useRef(false);
  const [debugPortalTarget, setDebugPortalTarget] = useState<HTMLElement | null>(null);

  // Collect debug events only when the in-browser tab debug overlay is enabled.
  const pushDebugEvent = useCallback((message: string) => {
    if (!debugEnabled) {
      return;
    }
    setDebugEvents((prev) => {
      const next = [message, ...prev];
      return next.length > 25 ? next.slice(0, 25) : next;
    });
  }, [debugEnabled]);

  useEffect(() => {
    if (debugEnabled) {
      setDebugPortalTarget(document.body);
    } else {
      setDebugPortalTarget(null);
    }
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;
    try {
      const storedTab = window.localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
      const storedPaths = window.localStorage.getItem(TAB_PATHS_KEY);
      if (storedPaths) {
        const parsed = JSON.parse(storedPaths) as Partial<Record<TabId, string>>;
        setTabPaths(sanitizeTabPaths(parsed));
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

  // Sanitize histories whenever the active tab changes so cross-tab entries do not leak through.
  useEffect(() => {
    if (debugEnabled) {
      const homeState = tabHistory.home ?? DEFAULT_HISTORY.home;
      const discoverState = tabHistory.discover ?? DEFAULT_HISTORY.discover;
      const savedState = tabHistory.saved ?? DEFAULT_HISTORY.saved;
      pushDebugEvent(
        `[switch] active=${activeTab} home=${homeState.index}/${homeState.entries.length - 1} discover=${discoverState.index}/${discoverState.entries.length - 1} saved=${savedState.index}/${savedState.entries.length - 1}`,
      );
    }
    setTabHistory((prev) => {
      let changed = false;
      const next: Record<TabId, TabHistoryState> = { ...prev };
      (Object.keys(DEFAULT_PATHS) as TabId[]).forEach((tab) => {
        const state = prev[tab] ?? DEFAULT_HISTORY[tab];
        const sanitized = sanitizeHistoryState(state, tab);
        if (
          sanitized.index !== state.index ||
          sanitized.entries.length !== state.entries.length ||
          sanitized.entries.some((entry, idx) => entry !== state.entries[idx])
        ) {
          next[tab] = sanitized;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeTab, debugEnabled, pushDebugEvent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const api = {
      enable: () => setDebugEnabled(true),
      disable: () => setDebugEnabled(false),
      toggle: () => setDebugEnabled((prev) => !prev),
      reset: () => setDebugEvents([]),
    };
    (window as unknown as { __tabDebug?: typeof api }).__tabDebug = api;
    return () => {
      const w = window as unknown as { __tabDebug?: typeof api };
      if (w.__tabDebug === api) {
        delete w.__tabDebug;
      }
    };
  }, []);

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

  // Expose the tab state API that components use to switch tabs and navigate within them.
  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      tabPaths,
      setTabPath: (tab: TabId, path: string) => {
        const cleaned = stripTabParam(path);
        const entryTab = inferTabFromRootPath(extractPathname(cleaned));
        if (entryTab && entryTab !== tab) {
          return;
        }
        setTabPaths((prev) =>
          prev[tab] === cleaned ? prev : { ...prev, [tab]: cleaned },
        );
      },
      recordTabPath: (tab: TabId, path: string) => {
        const cleaned = stripTabParam(path);
        const entryTab = inferTabFromRootPath(extractPathname(cleaned));
        if (entryTab && entryTab !== tab) {
          return;
        }
        if (skipNextHistoryPath.current[tab]) {
          if (skipNextHistoryPath.current[tab] === cleaned) {
            pushDebugEvent(`[skip] ${tab} -> ${cleaned}`);
            return;
          }
          skipNextHistoryPath.current[tab] = null;
        }
        if (lastRecordedPath.current[tab] === cleaned) {
          return;
        }
        setTabHistory((prev) => {
          const state = prev[tab] ?? DEFAULT_HISTORY[tab];
          const current = state.entries[state.index];
          if (current === cleaned) {
            return prev;
          }
        const nextEntries = [...state.entries.slice(0, state.index + 1), cleaned];
        pushDebugEvent(`[record] ${tab} -> ${cleaned}`);
        if (debugEnabled) {
          console.log("[tab-history] record", { tab, path: cleaned, nextEntries });
        }
        lastRecordedPath.current[tab] = cleaned;
        return { ...prev, [tab]: { entries: nextEntries, index: nextEntries.length - 1 } };
      });
      },
      // Walk backward through the current tab's history, falling back to the tab root when needed.
      goBackInTab: (tab: TabId, fallbackHref?: string) => {
        const state = tabHistory[tab] ?? DEFAULT_HISTORY[tab];
        const fallback = fallbackHref ?? DEFAULT_PATHS[tab];
        if (state.index <= 0) {
          skipNextHistoryPath.current[tab] = fallback;
          setTabHistory((prev) => ({
            ...prev,
            [tab]: { entries: [fallback], index: 0 },
          }));
          router.replace(fallback);
          return;
        }
        let nextIndex = state.index - 1;
        let target = state.entries[nextIndex] ?? fallback;
        while (nextIndex >= 0) {
          const entry = state.entries[nextIndex] ?? "";
          const entryTab = inferTabFromRootPath(extractPathname(entry));
          if (!entryTab || entryTab === tab) {
            target = entry || fallback;
            break;
          }
          nextIndex -= 1;
        }
        if (nextIndex < 0) {
          nextIndex = 0;
          target = fallback;
        }
        pushDebugEvent(`[back] ${tab} -> ${target}`);
        if (debugEnabled) {
          console.log("[tab-history] back", { tab, target, nextIndex });
        }
        skipNextHistoryPath.current[tab] = target;
        setTabHistory((prev) => ({
          ...prev,
          [tab]: { ...state, index: nextIndex },
        }));
        router.replace(target);
      },
      pendingSwitch,
      setPendingSwitch,
    }),
    [activeTab, debugEnabled, pendingSwitch, pushDebugEvent, tabHistory, tabPaths, router],
  );

  const debugCurrentPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : pathname;
  const debugHistoryLines = (tab: TabId) => {
    const state = tabHistory[tab] ?? DEFAULT_HISTORY[tab];
    return state.entries
      .map((entry, index) => `${index === state.index ? ">" : " "} ${index}: ${entry}`)
      .join("\n");
  };

  return (
    <TabContext.Provider value={value}>
      {children}
      {debugEnabled && debugPortalTarget
        ? createPortal(
            <div className="fixed right-[16px] top-[16px] z-[9999] w-[360px] max-h-[90vh] overflow-auto rounded-[16px] border border-black/10 bg-white/95 p-[12px] text-[11px] leading-[14px] text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Tab Debug</div>
                <div className="flex items-center gap-[6px]">
                  <button
                    type="button"
                    className="rounded-[10px] border border-black/10 px-[8px] py-[4px] text-[11px] font-medium"
                    onClick={() => {
                      setDebugEvents([]);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-[10px] border border-black/10 px-[8px] py-[4px] text-[11px] font-medium"
                    onClick={() => {
                      const payload = [
                        `activeTab: ${activeTab}`,
                        `path: ${debugCurrentPath}`,
                        `pendingSwitch: ${pendingSwitch ? JSON.stringify(pendingSwitch) : "null"}`,
                        "",
                        "home",
                        debugHistoryLines("home"),
                        "",
                        "discover",
                        debugHistoryLines("discover"),
                        "",
                        "saved",
                        debugHistoryLines("saved"),
                        "",
                        "events",
                        debugEvents.join("\n"),
                      ].join("\n");
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(payload).catch(() => {
                          window.prompt("Copy debug info:", payload);
                        });
                      } else {
                        window.prompt("Copy debug info:", payload);
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="mt-[6px]">
                <div>activeTab: {activeTab}</div>
                <div>path: {debugCurrentPath}</div>
                <div>pendingSwitch: {pendingSwitch ? JSON.stringify(pendingSwitch) : "null"}</div>
              </div>
              <div className="mt-[6px] whitespace-pre-wrap font-mono">
                home
                {"\n"}
                {debugHistoryLines("home")}
                {"\n\n"}
                discover
                {"\n"}
                {debugHistoryLines("discover")}
                {"\n\n"}
                saved
                {"\n"}
                {debugHistoryLines("saved")}
                {"\n\n"}
                events
                {"\n"}
                {debugEvents.join("\n")}
              </div>
            </div>,
            debugPortalTarget,
          )
        : null}
    </TabContext.Provider>
  );
}

// Reads the shared tab state and enforces provider usage.
export function useTabState() {
  const ctx = useContext(TabContext);
  if (!ctx) {
    throw new Error("useTabState must be used within TabProvider");
  }
  return ctx;
}

// Provides a specific tab scope to subtree content rendered from the cached viewport.
export function TabScopeProvider({
  tabId,
  children,
}: {
  tabId: TabId;
  children: ReactNode;
}) {
  return <TabScopeContext.Provider value={tabId}>{children}</TabScopeContext.Provider>;
}

// Returns the scoped tab when available, otherwise the active root tab.
export function useTabScope() {
  const scope = useContext(TabScopeContext);
  const { activeTab } = useTabState();
  return scope ?? activeTab;
}
