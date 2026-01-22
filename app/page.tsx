export default function Home() {
  const sections = Array.from({ length: 10 }, (_, index) => ({
    title: `Featured Collection ${index + 1}`,
    description:
      "A rotating selection of artworks, studies, and movement highlights.",
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Curated Highlights
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Discover new perspectives in art history.
        </h1>
        <p className="text-sm text-muted-foreground">
          This is placeholder content to show the scrollable page area inside
          the shell.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-border/70 bg-card p-5"
          >
            <h2 className="text-base font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {section.description}
            </p>
            <button
              className="mt-4 rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
              type="button"
            >
              View collection
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
