import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase";

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

type MovementRow = {
  id: string;
  slug: string | null;
  name: string;
  start_year: number | null;
  end_year: number | null;
  icon_url: string | null;
};

type TagRow = {
  id: string;
  slug: string | null;
  name: string;
  category: string | null;
};

const categoryIconMap: Record<string, string> = {
  medium: "/images/ui/components_and_tags/icon-medium.png",
  technique: "/images/ui/components_and_tags/icon-technique.png",
  representation: "/images/ui/components_and_tags/icon-representation.png",
  personality: "/images/ui/components_and_tags/icon-personality.png",
  emotion: "/images/ui/components_and_tags/icon-emotion.png",
  theme: "/images/ui/components_and_tags/icon-theme.png",
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatMovementYears(start?: number | null, end?: number | null) {
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start ? `${start}` : end ? `${end}` : "";
}

function resolveMovementImage(slug?: string | null, iconUrl?: string | null) {
  if (iconUrl) {
    return iconUrl;
  }
  if (slug) {
    return `/images/movements/${slug}.png`;
  }
  return "";
}

function formatTagLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  noStore();
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

  const [
    movementsResult,
    mediumTagsResult,
    techniqueTagsResult,
    representationTagsResult,
    personalityTagsResult,
    emotionTagsResult,
    themeTagsResult,
  ] = await Promise.all([
    supabase
      .from("movements")
      .select("id,slug,name,start_year,end_year,icon_url")
      .order("start_year", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "medium")
      .order("name"),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "technique")
      .order("name"),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "representation")
      .order("name"),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "personality")
      .order("name"),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "emotion")
      .order("name"),
    supabase
      .from("tags")
      .select("id,slug,name,category")
      .eq("category", "theme")
      .order("name"),
  ]);

  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }
  if (mediumTagsResult.error) {
    throw new Error(mediumTagsResult.error.message);
  }
  if (techniqueTagsResult.error) {
    throw new Error(techniqueTagsResult.error.message);
  }
  if (representationTagsResult.error) {
    throw new Error(representationTagsResult.error.message);
  }
  if (personalityTagsResult.error) {
    throw new Error(personalityTagsResult.error.message);
  }
  if (emotionTagsResult.error) {
    throw new Error(emotionTagsResult.error.message);
  }
  if (themeTagsResult.error) {
    throw new Error(themeTagsResult.error.message);
  }

  const movements = (movementsResult.data ?? []) as MovementRow[];
  const movementColumns = chunk(movements, 2);

  const mediumTags = (mediumTagsResult.data ?? []) as TagRow[];
  const techniqueTags = (techniqueTagsResult.data ?? []) as TagRow[];
  const representationTags = (representationTagsResult.data ?? []) as TagRow[];
  const personalityTags = (personalityTagsResult.data ?? []) as TagRow[];
  const emotionTags = (emotionTagsResult.data ?? []) as TagRow[];
  const themeTags = (themeTagsResult.data ?? []) as TagRow[];

  const renderTag = (tag: TagRow, uppercase = false) => (
    <Link
      key={tag.id}
      href={`/tag/${tag.slug ?? tag.id}`}
      className="flex shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] px-[14px] py-[10px]"
    >
      <span className="text-[16px] font-medium text-[#1e1e1e] [font-family:var(--font-instrument-sans)]">
        {uppercase ? formatTagLabel(tag.name).toUpperCase() : formatTagLabel(tag.name)}
      </span>
    </Link>
  );

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-white">
      <div className="pointer-events-none absolute left-0 top-0 h-[100px] w-full bg-gradient-to-t from-[rgba(255,255,255,0)] from-50% to-[rgba(255,255,255,0.9)]" />

      <section className="flex w-full flex-col px-[20px] pb-[32px] pt-[100px]">
        <p className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
          {query ? "Search results" : "Browse"}
        </p>
      </section>

      {query ? (
        <section className="flex w-full flex-col gap-[16px] px-[20px] pb-[32px]">
          {errorMessage ? (
            <div className="rounded-[16px] border border-[#f0d6d6] bg-[#fff7f7] px-[16px] py-[12px] text-[14px] text-[#a64040]">
              {errorMessage}
            </div>
          ) : null}

          {results.length === 0 && !errorMessage ? (
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
        </section>
      ) : (
        <div className="flex w-full flex-col gap-[32px] pb-[32px]">
          <section className="flex w-full flex-col gap-[8px] overflow-hidden">
            <div className="flex w-full items-center px-[20px]">
              <p className="text-[14px] font-semibold uppercase tracking-[0.28px] text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                Movements
              </p>
            </div>
            <div className="flex w-full items-start gap-[10px] overflow-x-auto px-[20px] pb-[4px] hide-scrollbar [scroll-padding-left:20px] [scroll-snap-type:x_mandatory]">
              {movementColumns.map((column, columnIndex) => (
                <div
                  key={`movement-col-${columnIndex}`}
                  className="flex w-[340px] max-w-[340px] shrink-0 flex-col gap-[10px] [scroll-snap-align:start]"
                >
                  {column.map((movement) => {
                    const years = formatMovementYears(
                      movement.start_year,
                      movement.end_year,
                    );
                    const href = movement.slug
                      ? `/movement/${movement.slug}`
                      : movement.id && uuidRegex.test(movement.id)
                        ? `/movement/${movement.id}`
                        : undefined;
                    return (
                      <Link
                        key={movement.id}
                        className="flex w-full items-center gap-[8px] rounded-[24px] border border-[#d9d9d9] bg-white pl-[8px] pr-[16px] py-[16px]"
                        href={href ?? "/movement"}
                      >
                        <div className="flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-[20px]">
                          {resolveMovementImage(movement.slug, movement.icon_url) ? (
                            <img
                              alt={movement.name}
                              className="h-full w-full object-cover"
                              src={resolveMovementImage(
                                movement.slug,
                                movement.icon_url,
                              )}
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col items-start justify-between text-center">
                          <p className="text-[20px] font-semibold text-[#1e1e1e] [font-family:var(--font-literata)]">
                            {movement.name}
                          </p>
                          <div className="flex items-center gap-[4px] text-[16px] text-[#757575] tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
                            {years || "YYYY - YYYY"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {[
            { label: "Medium", tags: mediumTags, icon: categoryIconMap.medium },
            { label: "Technique", tags: techniqueTags, icon: categoryIconMap.technique },
            {
              label: "Representation",
              tags: representationTags,
              icon: categoryIconMap.representation,
            },
            {
              label: "Personality",
              tags: personalityTags,
              icon: categoryIconMap.personality,
            },
            { label: "Emotion", tags: emotionTags, icon: categoryIconMap.emotion },
          ].map((row) => (
            <section key={row.label} className="flex w-full flex-col gap-[8px]">
              <div className="flex w-full items-center gap-[4px] px-[20px]">
                <div className="relative h-[32px] w-[32px]">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-contain opacity-80"
                    src={row.icon}
                  />
                </div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.28px] text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                  {row.label}
                </p>
              </div>
              <div className="flex w-full items-start gap-[8px] overflow-x-auto px-[20px] pb-[4px] hide-scrollbar">
            {row.tags.map((tag) => renderTag(tag, row.label === "Personality"))}
          </div>
        </section>
      ))}

          <section className="flex w-full flex-col gap-[8px]">
            <div className="flex w-full items-center gap-[4px] px-[20px]">
              <div className="relative h-[32px] w-[32px]">
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain"
                  src={categoryIconMap.theme}
                />
              </div>
              <p className="text-[14px] font-semibold uppercase tracking-[0.28px] text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                Themes
              </p>
            </div>
            <div className="flex w-full flex-wrap items-start gap-[8px] overflow-x-auto overflow-y-clip px-[20px] pb-[4px] hide-scrollbar">
              {themeTags.map(renderTag)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
