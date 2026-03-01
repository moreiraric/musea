export function TopNav() {
  return (
    <header className="shrink-0 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[100px] max-w-4xl items-end justify-between px-4 pb-4">
        <span className="text-sm font-semibold tracking-wide">Musea</span>
        <button
          className="rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
          type="button"
        >
          Search
        </button>
      </div>
    </header>
  );
}
