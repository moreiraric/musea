// Search and discover page for artists, artworks, movements, and tag categories.
// It serves both the blank discover state and the query-driven search results state.

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { SearchResults } from "@/app/search/search-results";
import { MovementCardSmall } from "@/components/movement-card-small";
import { DiscoverSearchHeader } from "@/components/discover-search-header";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { ThemeTile } from "@/components/theme-tile";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  buildSearchFilter,
  buildSearchTokens,
  matchesSearchText,
  scoreRelevance,
} from "@/lib/search-utils";

export const dynamic = "force-dynamic";

const SEARCH_CANDIDATE_LIMIT = 500;

// === DATA SHAPES ===

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchArtwork = {
  id: string;
  slug: string | null;
  title: string;
  image_url: string | null;
  artists?: {
    id: string;
    slug: string | null;
    name: string;
    image_url: string | null;
  } | null;
};

type SearchArtist = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
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

// === RESULT PARSING ===

function isSearchArtist(value: unknown): value is SearchArtist {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.image_url === "string" ||
      row.image_url === null ||
      row.image_url === undefined)
  );
}

function getRelatedArtist(value: unknown): SearchArtist | null {
  if (Array.isArray(value)) {
    return value.find(isSearchArtist) ?? null;
  }
  return isSearchArtist(value) ? value : null;
}

function parseSearchArtworks(value: unknown): SearchArtwork[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }
    const record = row as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.title !== "string" ||
      (typeof record.slug !== "string" && record.slug !== null && record.slug !== undefined) ||
      (typeof record.image_url !== "string" &&
        record.image_url !== null &&
        record.image_url !== undefined)
    ) {
      return [];
    }
    return [
      {
        id: record.id,
        slug: typeof record.slug === "string" ? record.slug : null,
        title: record.title,
        image_url: typeof record.image_url === "string" ? record.image_url : null,
        artists: getRelatedArtist(record.artists),
      },
    ];
  });
}

function parseSearchArtists(value: unknown): SearchArtist[] {
  return Array.isArray(value) ? value.filter(isSearchArtist) : [];
}

// Validates movement rows used for the blank-state browse rail.
function isMovementRow(value: unknown): value is MovementRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.start_year === "number" ||
      row.start_year === null ||
      row.start_year === undefined) &&
    (typeof row.end_year === "number" ||
      row.end_year === null ||
      row.end_year === undefined) &&
    (typeof row.icon_url === "string" ||
      row.icon_url === null ||
      row.icon_url === undefined)
  );
}

function isTagRow(value: unknown): value is TagRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.category === "string" ||
      row.category === null ||
      row.category === undefined)
  );
}

// === DISCOVER CONFIGURATION ===

const categoryIconMap: Record<string, string> = {
  movement: "/images/ui/other/icon-movement-outline.svg",
  medium: "/images/ui/components_and_tags/icon-medium.png",
  technique: "/images/ui/components_and_tags/icon-technique.png",
  representation: "/images/ui/components_and_tags/icon-representation.png",
  personality: "/images/ui/components_and_tags/icon-personality.png",
  emotion: "/images/ui/components_and_tags/icon-emotion.png",
  theme: "/images/ui/components_and_tags/icon-theme.png",
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const representationSortOrder = new Map([
  ["realism", 0],
  ["semi-abstract", 1],
  ["semi abstract", 1],
  ["abstract", 2],
]);

// === DISPLAY HELPERS ===

// Formats movement years for the discover movement rail.
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

// Normalizes tag names into the UI's preferred title-cased labels.
function formatTagLabel(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "semi abstract" || normalized === "semi-abstract") {
    return "Semi-Abstract";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function sortRepresentationTags(tags: TagRow[]) {
  return [...tags].sort((a, b) => {
    const keyA = (a.slug ?? a.name).trim().toLowerCase();
    const keyB = (b.slug ?? b.name).trim().toLowerCase();
    const orderA = representationSortOrder.get(keyA) ?? Number.MAX_SAFE_INTEGER;
    const orderB = representationSortOrder.get(keyB) ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortMediumTags(tags: TagRow[]) {
  return [...tags].sort((a, b) => {
    const keyA = (a.slug ?? a.name).trim().toLowerCase();
    const keyB = (b.slug ?? b.name).trim().toLowerCase();
    const isGouacheA = keyA === "gouache";
    const isGouacheB = keyB === "gouache";

    if (isGouacheA !== isGouacheB) {
      return isGouacheA ? 1 : -1;
    }

    return a.name.localeCompare(b.name);
  });
}

// Groups movement rows into columns for the blank discover grid.
function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

// Reads the query string value from either Next.js search params shape.
function resolveQuery(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
) {
  if (!searchParams) {
    return "";
  }
  if (typeof (searchParams as URLSearchParams).get === "function") {
    return ((searchParams as URLSearchParams).get("q") ?? "").trim();
  }
  const value = (searchParams as Record<string, string | string[] | undefined>).q;
  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }
  return (value ?? "").trim();
}

// Reads whether the discover search UI should start expanded.
function resolveSearchOpen(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
) {
  if (!searchParams) {
    return false;
  }
  if (typeof (searchParams as URLSearchParams).get === "function") {
    return (searchParams as URLSearchParams).get("search") === "1";
  }
  const value = (searchParams as Record<string, string | string[] | undefined>).search;
  if (Array.isArray(value)) {
    return value[0] === "1";
  }
  return value === "1";
}

// Fetches either search results or discover browse content depending on the query.
export default async function SearchPage({ searchParams }: SearchPageProps) {
  noStore();
  const resolvedParams = await searchParams;
  const query = resolveQuery(resolvedParams);
  const isSearchOpen = resolveSearchOpen(resolvedParams) || Boolean(query);
  const supabase = createSupabaseServerClient();

  const artworkPageSize = 8;
  const artistPageSize = 10;

  let initialArtworks: SearchArtwork[] = [];
  let initialArtists: SearchArtist[] = [];
  let initialHasMoreArtworks = false;
  let initialHasMoreArtists = false;

  // Query mode fetches and ranks matching artists and artworks.
  if (query) {
    // Search first widens the candidate set, then local scoring narrows it back down.
    const tokens = buildSearchTokens(query);
    const titleFilter = buildSearchFilter(tokens, ["title"]);
    const artistFilter = buildSearchFilter(tokens, ["name"]);
    let matchingArtistIds: string[] = [];

    if (artistFilter) {
      const { data, error } = await supabase
        .from("artists")
        .select("id")
        .or(artistFilter)
        .limit(SEARCH_CANDIDATE_LIMIT);

      if (error) {
        throw new Error(error.message);
      }

      const rows = Array.isArray(data)
        ? data.filter((row): row is { id: string } => typeof row?.id === "string")
        : [];
      matchingArtistIds = rows.map((row) => row.id);
    }

    const artworkFilter = [
      titleFilter,
      matchingArtistIds.length > 0
        ? `artist_id.in.(${matchingArtistIds.join(",")})`
        : "",
    ]
      .filter(Boolean)
      .join(",");

    if (artworkFilter) {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,image_url,artists(id,name,slug,image_url)")
        .or(artworkFilter)
        .limit(SEARCH_CANDIDATE_LIMIT);

      if (error) {
        throw new Error(error.message);
      }
      const rows = parseSearchArtworks(data)
        .filter((artwork) =>
          matchesSearchText(artwork.title, query) ||
          matchesSearchText(artwork.artists?.name ?? "", query),
        )
        .sort((a, b) => {
          const artistNameA = a.artists?.name ?? "";
          const artistNameB = b.artists?.name ?? "";
          const scoreA = Math.max(
            scoreRelevance(a.title, query, tokens),
            scoreRelevance(artistNameA, query, tokens),
          );
          const scoreB = Math.max(
            scoreRelevance(b.title, query, tokens),
            scoreRelevance(artistNameB, query, tokens),
          );

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }

          return a.title.localeCompare(b.title);
        });
      initialHasMoreArtworks = rows.length > artworkPageSize;
      initialArtworks = initialHasMoreArtworks ? rows.slice(0, artworkPageSize) : rows;
    }

    if (artistFilter) {
      const { data, error } = await supabase
        .from("artists")
        .select("id,slug,name,image_url")
        .or(artistFilter)
        .limit(SEARCH_CANDIDATE_LIMIT);

      if (error) {
        throw new Error(error.message);
      }
      const rows = parseSearchArtists(data)
        .filter((artist) => matchesSearchText(artist.name, query))
        .sort((a, b) => {
          const scoreA = scoreRelevance(a.name, query, tokens);
          const scoreB = scoreRelevance(b.name, query, tokens);

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }

          return a.name.localeCompare(b.name);
        });
      initialHasMoreArtists = rows.length > artistPageSize;
      initialArtists = initialHasMoreArtists ? rows.slice(0, artistPageSize) : rows;
    }
  }

  let movements: MovementRow[] = [];
  let movementColumns: MovementRow[][] = [];
  let mediumTags: TagRow[] = [];
  let techniqueTags: TagRow[] = [];
  let representationTags: TagRow[] = [];
  let personalityTags: TagRow[] = [];
  let emotionTags: TagRow[] = [];
  let themeTags: TagRow[] = [];

  // Empty-query mode builds the discover landing sections instead of search results.
  if (!query) {
    // The discover surface is assembled from independent category queries, so load them together.
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

    movements = Array.isArray(movementsResult.data)
      ? movementsResult.data.filter(isMovementRow)
      : [];
    movementColumns = chunk(movements, 2);

    mediumTags = Array.isArray(mediumTagsResult.data)
      ? sortMediumTags(mediumTagsResult.data.filter(isTagRow))
      : [];
    techniqueTags = Array.isArray(techniqueTagsResult.data)
      ? techniqueTagsResult.data.filter(isTagRow)
      : [];
    representationTags = Array.isArray(representationTagsResult.data)
      ? sortRepresentationTags(representationTagsResult.data.filter(isTagRow))
      : [];
    personalityTags = Array.isArray(personalityTagsResult.data)
      ? personalityTagsResult.data.filter(isTagRow)
      : [];
    emotionTags = Array.isArray(emotionTagsResult.data)
      ? emotionTagsResult.data.filter(isTagRow)
      : [];
    themeTags = Array.isArray(themeTagsResult.data) ? themeTagsResult.data.filter(isTagRow) : [];
  }

  const renderTag = (tag: TagRow, uppercase = false) => (
    <Link
      key={tag.id}
      href={`/tag/${tag.slug ?? tag.id}`}
      className="flex shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] px-[14px] py-[10px]"
    >
      <span
        className={`text-label-primary text-[#1e1e1e] ${
          uppercase ? "uppercase" : "normal-case"
        }`}
      >
        {formatTagLabel(tag.name)}
      </span>
    </Link>
  );

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-white pt-[100px]">
      <DiscoverSearchHeader query={query} isSearchOpen={isSearchOpen} />

      {/* When the search UI is open, either show live results or an empty search canvas. */}
      {isSearchOpen ? (
        query ? (
          <SearchResults
            key={query}
            query={query}
            initialArtworks={initialArtworks}
            initialArtists={initialArtists}
            initialHasMoreArtworks={initialHasMoreArtworks}
            initialHasMoreArtists={initialHasMoreArtists}
            artworkPageSize={artworkPageSize}
            artistPageSize={artistPageSize}
          />
        ) : (
          <div className="flex w-full flex-col px-[20px] pb-[32px]" />
        )
      ) : (
        <div className="flex w-full flex-col pb-[32px]">
          <section className="px-[20px] py-[16px]">
            <p className="text-header-ui-page text-[#1e1e1e]">
              Discover
            </p>
          </section>
          <div className="flex w-full flex-col gap-[32px]">
            {/* Movements anchor the discover page because they define a broad art-history timeline. */}
            <section className="flex w-full flex-col gap-[12px] overflow-hidden">
            <div className="flex w-full items-center gap-[8px] px-[20px]">
              <div className="relative h-[24px] w-[24px]">
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain"
                  src={categoryIconMap.movement}
                />
              </div>
              <p className="text-header-ui-overline text-[#757575]">
                Movements
              </p>
            </div>
            <HorizontalDragScroll
              className="flex w-full items-start gap-[10px] overflow-x-auto px-[20px] hide-scrollbar [scroll-padding-left:20px] [scroll-snap-type:x_mandatory]"
              disableSnapWhileDragging
            >
              {movementColumns.map((column, columnIndex) => (
                <div
                  key={`movement-col-${columnIndex}`}
                  className="flex w-[330px] max-w-[330px] shrink-0 flex-col gap-[10px] [scroll-snap-align:start]"
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
                    const imageUrl = resolveMovementImage(
                      movement.slug,
                      movement.icon_url,
                    );
                    return (
                      <MovementCardSmall
                        key={movement.id}
                        name={movement.name}
                        years={years}
                        imageUrl={imageUrl}
                        href={href ?? "/movement"}
                        fallbackYears="YYYY - YYYY"
                      />
                    );
                  })}
                </div>
              ))}
            </HorizontalDragScroll>
            </section>

            {/* Tag categories break browsing into quick visual entry points. */}
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
              uppercase: true,
            },
            { label: "Emotion", tags: emotionTags, icon: categoryIconMap.emotion },
          ].map((row) => (
            <section key={row.label} className="flex w-full flex-col gap-[10px]">
              <div className="flex w-full items-center gap-[8px] px-[20px]">
                <div className="relative h-[24px] w-[24px]">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-contain opacity-80"
                    src={row.icon}
                  />
                </div>
                <p className="text-header-ui-overline text-[#757575]">
                  {row.label}
                </p>
              </div>
              <HorizontalDragScroll className="flex w-full items-start gap-[8px] overflow-x-auto px-[20px] hide-scrollbar">
                {row.tags.map((tag) => renderTag(tag, Boolean(row.uppercase)))}
              </HorizontalDragScroll>
            </section>
          ))}

          <section className="flex w-full flex-col gap-[10px]">
            <div className="flex w-full items-center gap-[8px] px-[20px]">
              <div className="relative h-[24px] w-[24px]">
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain opacity-80"
                  src={categoryIconMap.theme}
                />
              </div>
              <p className="text-header-ui-overline text-[#757575]">
                Themes
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-[8px] px-[20px]">
              {themeTags.map((tag) => (
                <ThemeTile
                  key={tag.id}
                  href={`/tag/${tag.slug ?? tag.id}`}
                  name={tag.name}
                  slug={tag.slug}
                />
              ))}
            </div>
          </section>
          </div>
        </div>
      )}
    </div>
  );
}
