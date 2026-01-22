const navItems = ["Home", "Explore", "Saved", "Profile"];

export function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex h-[100px] max-w-4xl flex-col justify-between px-2 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item}
              className="rounded-full px-3 py-2 text-xs font-medium transition hover:bg-muted"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mx-auto h-1.5 w-28 rounded-full bg-foreground/80" />
      </div>
    </nav>
  );
}
