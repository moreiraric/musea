import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase";
import { SearchForm } from "@/components/search-form";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: { q?: string };
};

type ArtworkResult = {
  id: string;
  title: string;
  image_url: string | null;
  artists?: { name: string } | null;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams.q ?? "").trim();
  const supabase = createSupabaseServerClient();

  let results: ArtworkResult[] = [];
  let errorMessage = "";

  if (query) {
    const { data, error } = await supabase
      .from("artworks")
      .select("id,slug,title,image_url,artists(name)")
      .or(`title.ilike.%${query}%,artists.name.ilike.%${query}%`)
      .order("title", { ascending: true })
      .limit(30);

    if (error) {
      errorMessage = error.message;
    } else {
      results = (data ?? []) as ArtworkResult[];
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-[20px] px-[20px] py-[24px]">
      <header className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-[#757575] [font-family:var(--font-instrument-sans)]">
          Search
        </p>
        <h1 className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
          Find paintings by title or artist.
        </h1>
      </header>

      <SearchForm initialQuery={query} />

      {errorMessage ? (
        <div className="rounded-[16px] border border-[#f0d6d6] bg-[#fff7f7] px-[16px] py-[12px] text-[14px] text-[#a64040]">
          {errorMessage}
        </div>
      ) : null}

      {!query ? (
        <div className="rounded-[16px] border border-[#e6e6e6] bg-[#fafafa] px-[16px] py-[12px] text-[14px] text-[#757575]">
          Start typing to search for artwork titles or artist names.
        </div>
      ) : null}

      {query && results.length === 0 && !errorMessage ? (
        <div className="rounded-[16px] border border-[#e6e6e6] bg-[#fafafa] px-[16px] py-[12px] text-[14px] text-[#757575]">
          No results for “{query}”.
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="flex flex-col gap-[12px]">
          {results.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artwork/${artwork.slug ?? artwork.id}`}
              className="flex items-center gap-[16px] rounded-[20px] border border-[#e6e6e6] bg-white px-[16px] py-[12px] transition hover:border-[#d0d0d0]"
            >
              <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[14px] bg-[#f0f0f0]">
                {artwork.image_url ? (
                  <img
                    alt={artwork.title}
                    className="h-full w-full object-cover"
                    src={artwork.image_url}
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-[4px]">
                <span className="text-[18px] font-semibold text-[#1e1e1e] [font-family:var(--font-literata)]">
                  {artwork.title}
                </span>
                <span className="text-[14px] text-[#757575] [font-family:var(--font-jetbrains-mono)]">
                  {artwork.artists?.name ?? "Unknown artist"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
