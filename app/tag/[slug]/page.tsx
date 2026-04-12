// Tag detail page that shows a banner, filter chips, and matching artworks.
// It resolves a tag slug, applies optional movement and technique filters, and computes filter counts.

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { TagFilters } from "@/components/tag-filters";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { TagTopBar } from "@/components/tag-top-bar";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// === DATA SHAPES ===

type TagPageProps = {
  params: { slug: string };
  searchParams?: {
    movement?: string;
    medium?: string;
    technique?: string;
  };
};

type ArtworkRow = {
  id: string;
  slug: string | null;
  title: string;
  image_url: string | null;
  movement_id: string | null;
  year: number | null;
  artists?: {
    id: string;
    slug: string | null;
    name: string;
    image_url: string | null;
  } | null;
};

type MovementRow = {
  id: string;
  slug: string;
  name: string;
};

type TagOption = {
  id: string;
  slug: string;
  name: string;
};

type BannerArtworkRow = {
  slug: string | null;
  title: string;
  image_url: string | null;
};

// === HELPER FUNCTIONS ===

// Normalizes the tag title for headings and filter labels.
function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getGridImageUrl(url: string, size = 360) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("w", String(size));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
    if (parsed.hostname === "upload.wikimedia.org") {
      return url;
    }
  } catch {
    // ignore invalid URLs
  }
  return url;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IN_CHUNK_SIZE = 100;

// Intersects filter result sets while handling missing lists gracefully.
function intersectIds(base: string[] | null | undefined, next?: string[] | null) {
  const safeBase = base ?? [];
  if (!next) {
    return safeBase;
  }
  const nextSet = new Set(next);
  return safeBase.filter((id) => nextSet.has(id));
}

function chunkArray<T>(items: T[], size = IN_CHUNK_SIZE) {
  if (items.length <= size) {
    return [items];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// === RESULT PARSING ===

function isMovementRow(value: unknown): value is MovementRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.slug === "string" && typeof row.name === "string";
}

function isTagOption(value: unknown): value is TagOption {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.id === "string" && typeof row.slug === "string" && typeof row.name === "string";
}

function isRelatedArtist(value: unknown): value is NonNullable<ArtworkRow["artists"]> {
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

function getRelatedArtist(value: unknown): NonNullable<ArtworkRow["artists"]> | null {
  if (Array.isArray(value)) {
    return value.find(isRelatedArtist) ?? null;
  }
  return isRelatedArtist(value) ? value : null;
}

function isArtworkRow(value: unknown): value is ArtworkRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.image_url === "string" ||
      row.image_url === null ||
      row.image_url === undefined) &&
    (typeof row.movement_id === "string" ||
      row.movement_id === null ||
      row.movement_id === undefined) &&
    (typeof row.year === "number" || row.year === null || row.year === undefined)
  );
}

function parseArtworkRows(value: unknown): ArtworkRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((row) => {
    if (!isArtworkRow(row)) {
      return [];
    }
    return [{ ...row, artists: getRelatedArtist((row as { artists?: unknown }).artists) }];
  });
}

function isBannerArtworkRow(value: unknown): value is BannerArtworkRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.title === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.image_url === "string" ||
      row.image_url === null ||
      row.image_url === undefined)
  );
}

// Fetches the tag page data and applies the selected filter combination.
export default async function TagPage({ params, searchParams }: TagPageProps) {
  noStore();
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const raw =
    typeof resolvedParams.slug === "string"
      ? resolvedParams.slug
      : Array.isArray(resolvedParams.slug)
        ? resolvedParams.slug[0] ?? ""
        : "";
  const decoded = decodeURIComponent(raw);
  const normalized = decoded.trim().toLowerCase();
  const movementSlug =
    typeof resolvedSearchParams?.movement === "string" ? resolvedSearchParams.movement : "";
  const mediumSlug =
    typeof resolvedSearchParams?.medium === "string" ? resolvedSearchParams.medium : "";
  const techniqueSlug =
    typeof resolvedSearchParams?.technique === "string" ? resolvedSearchParams.technique : "";

  const supabase = createSupabaseServerClient();

  // Resolve the tag by slug first, then fall back to looser slug and name matching.
  let tagResult = await supabase
    .from("tags")
    .select("id,slug,name,description,banner,category")
    .eq("slug", normalized)
    .limit(1)
    .maybeSingle();
  if (!tagResult.data && !tagResult.error) {
    tagResult = await supabase
      .from("tags")
      .select("id,slug,name,description,banner,category")
      .ilike("slug", normalized)
      .limit(1)
      .maybeSingle();
  }
  if (!tagResult.data && !tagResult.error) {
    const nameGuess = normalized.replaceAll("-", " ");
    tagResult = await supabase
      .from("tags")
      .select("id,slug,name,description,banner,category")
      .ilike("name", nameGuess)
      .limit(1)
      .maybeSingle();
  }

  const { data: tag, error: tagError } = tagResult;

  if (tagError) {
    throw new Error(tagError.message);
  }

  if (!tag) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Tag lookup failed", { raw, decoded, normalized });
    }
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Tag not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No row returned for {raw || "(empty)"}.
        </p>
      </div>
    );
  }

  const [bannerResult, movementsResult, mediumTagsResult, techniqueTagsResult] =
    await Promise.all([
      tag.banner
        ? uuidRegex.test(tag.banner)
          ? supabase
              .from("artworks")
              .select("slug,title,image_url")
              .eq("id", tag.banner)
              .maybeSingle()
          : supabase
              .from("artworks")
              .select("slug,title,image_url")
              .eq("slug", tag.banner)
              .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("movements").select("id,slug,name").order("name"),
      supabase
        .from("tags")
        .select("id,slug,name")
        .eq("category", "medium")
        .order("name"),
      supabase
        .from("tags")
        .select("id,slug,name")
        .eq("category", "technique")
        .order("name"),
    ]);

  if (bannerResult.error) {
    throw new Error(bannerResult.error.message);
  }
  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }
  if (mediumTagsResult.error) {
    throw new Error(mediumTagsResult.error.message);
  }
  if (techniqueTagsResult.error) {
    throw new Error(techniqueTagsResult.error.message);
  }

  const bannerArtwork = isBannerArtworkRow(bannerResult.data) ? bannerResult.data : null;

  const movementOptions = Array.isArray(movementsResult.data)
    ? movementsResult.data.filter(isMovementRow)
    : [];
  const mediumOptions = Array.isArray(mediumTagsResult.data)
    ? mediumTagsResult.data.filter(isTagOption)
    : [];
  const techniqueOptions = Array.isArray(techniqueTagsResult.data)
    ? techniqueTagsResult.data.filter(isTagOption)
    : [];

  const movementFilter = movementSlug
    ? movementOptions.find((movement) => movement.slug === movementSlug)
    : null;
  const mediumFilter = mediumSlug
    ? mediumOptions.find((option) => option.slug === mediumSlug)
    : null;
  const techniqueFilter = techniqueSlug
    ? techniqueOptions.find((option) => option.slug === techniqueSlug)
    : null;

  const invalidFilters: string[] = [];
  if (mediumSlug && !mediumFilter) {
    invalidFilters.push("medium");
  }
  if (techniqueSlug && !techniqueFilter) {
    invalidFilters.push("technique");
  }

  const {
    data: baseTagRows,
    error: baseTagError,
  } = await supabase
    .from("artwork_tags")
    .select("artwork_id")
    .eq("tag_id", tag.id);

  if (baseTagError) {
    throw new Error(baseTagError.message);
  }

  const baseTagArtworkIds = (baseTagRows ?? []).map(
    (row) => row.artwork_id as string,
  );

  // Start from all artworks on the base tag, then narrow down by selected filters.
  const baseArtworks: ArtworkRow[] = [];
  if (baseTagArtworkIds.length > 0) {
    for (const chunk of chunkArray(baseTagArtworkIds)) {
      const query = supabase
        .from("artworks")
        .select("id,slug,title,image_url,movement_id,year,artists(id,name,slug,image_url))")
        .in("id", chunk);
      const { data, error } = movementFilter
        ? await query.eq("movement_id", movementFilter.id)
        : await query;
      if (error) {
        throw new Error(error.message);
      }
      baseArtworks.push(...parseArtworkRows(data));
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Tag page filters", {
      tagId: tag.id,
      movementSlug,
      movementId: movementFilter?.id ?? null,
      mediumSlug,
      mediumId: mediumFilter?.id ?? null,
      techniqueSlug,
      techniqueId: techniqueFilter?.id ?? null,
      baseArtworksCount: baseArtworks?.length ?? 0,
    });
  }

  let artworks: ArtworkRow[] = baseArtworks;

  // Apply optional medium and technique filters after the base tag query resolves.
  let mediumArtworkIds: string[] | null = null;
  if (mediumFilter) {
    const { data: mediumRows, error: mediumError } = await supabase
      .from("artwork_tags")
      .select("artwork_id")
      .eq("tag_id", mediumFilter.id);
    if (mediumError) {
      throw new Error(mediumError.message);
    }
    mediumArtworkIds = (mediumRows ?? []).map((row) => row.artwork_id as string);
    const mediumSet = new Set(mediumArtworkIds);
    artworks = artworks.filter((artwork) => mediumSet.has(artwork.id));
  }

  let techniqueArtworkIds: string[] | null = null;
  if (techniqueFilter) {
    const { data: techniqueRows, error: techniqueError } = await supabase
      .from("artwork_tags")
      .select("artwork_id")
      .eq("tag_id", techniqueFilter.id);
    if (techniqueError) {
      throw new Error(techniqueError.message);
    }
    techniqueArtworkIds = (techniqueRows ?? []).map(
      (row) => row.artwork_id as string,
    );
    const techniqueSet = new Set(techniqueArtworkIds);
    artworks = artworks.filter((artwork) => techniqueSet.has(artwork.id));
  }

  artworks = artworks
    .sort((a, b) => {
      const yearCompare = (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER);
      if (yearCompare !== 0) {
        return yearCompare;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 24);

  const fallbackBannerArtwork =
    artworks.find((artwork) => Boolean(artwork.image_url)) ?? null;
  const bannerImageUrl =
    bannerArtwork?.image_url ?? fallbackBannerArtwork?.image_url ?? "";
  const bannerAlt = bannerArtwork?.title ?? fallbackBannerArtwork?.title ?? tag.name;

  const movementCounts: Record<string, number> = {};
  const mediumCounts: Record<string, number> = {};
  const techniqueCounts: Record<string, number> = {};

  // Recompute available filter counts from the partially filtered result sets.
  let movementArtworkIds: string[] | null = null;
  if (movementFilter && baseTagArtworkIds.length > 0) {
    try {
      const movementIds: string[] = [];
      for (const chunk of chunkArray(baseTagArtworkIds)) {
        const { data: movementRows, error: movementError } = await supabase
          .from("artworks")
          .select("id")
          .in("id", chunk)
          .eq("movement_id", movementFilter.id);
        if (movementError) {
          throw new Error(movementError.message);
        }
        movementIds.push(...(movementRows ?? []).map((row) => row.id as string));
      }
      movementArtworkIds = movementIds;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Tag page movement filter query failed", error);
      }
    }
  }

  const baseForMovement = intersectIds(
    intersectIds(baseTagArtworkIds, mediumArtworkIds ?? null),
    techniqueArtworkIds ?? null,
  );

  if (baseForMovement.length > 0) {
    try {
      for (const chunk of chunkArray(baseForMovement)) {
        const { data: movementRows, error: movementError } = await supabase
          .from("artworks")
          .select("id,movement_id")
          .in("id", chunk);
        if (movementError) {
          throw new Error(movementError.message);
        }
        (movementRows ?? []).forEach((row) => {
          if (!row.movement_id) {
            return;
          }
          movementCounts[row.movement_id] = (movementCounts[row.movement_id] ?? 0) + 1;
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Tag page movement counts failed", error);
      }
    }
  }

  const baseForMedium = intersectIds(
    intersectIds(baseTagArtworkIds, movementArtworkIds ?? null),
    techniqueArtworkIds ?? null,
  );

  if (baseForMedium.length > 0 && mediumOptions.length > 0) {
    try {
      const mediumTagIds = mediumOptions.map((option) => option.id);
      for (const chunk of chunkArray(baseForMedium)) {
        const { data: mediumRows, error: mediumError } = await supabase
          .from("artwork_tags")
          .select("tag_id")
          .in("artwork_id", chunk)
          .in("tag_id", mediumTagIds);
        if (mediumError) {
          throw new Error(mediumError.message);
        }
        (mediumRows ?? []).forEach((row) => {
          const tagId = row.tag_id as string;
          mediumCounts[tagId] = (mediumCounts[tagId] ?? 0) + 1;
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Tag page medium counts failed", error);
      }
    }
  }

  const baseForTechnique = intersectIds(
    intersectIds(baseTagArtworkIds, movementArtworkIds ?? null),
    mediumArtworkIds ?? null,
  );

  if (baseForTechnique.length > 0 && techniqueOptions.length > 0) {
    try {
      const techniqueTagIds = techniqueOptions.map((option) => option.id);
      for (const chunk of chunkArray(baseForTechnique)) {
        const { data: techniqueRows, error: techniqueError } = await supabase
          .from("artwork_tags")
          .select("tag_id")
          .in("artwork_id", chunk)
          .in("tag_id", techniqueTagIds);
        if (techniqueError) {
          throw new Error(techniqueError.message);
        }
        (techniqueRows ?? []).forEach((row) => {
          const tagId = row.tag_id as string;
          techniqueCounts[tagId] = (techniqueCounts[tagId] ?? 0) + 1;
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Tag page technique counts failed", error);
      }
    }
  }

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-white">
      <TagTopBar />

      {/* Start with a visual banner so the tag page feels more like a destination than a filter list. */}
      <section className="flex w-full flex-col">
        <div
          className={`flex h-[291px] w-full items-center justify-center bg-[#f5f5f5] ${
            bannerImageUrl ? "" : "px-[32px] py-[10px]"
          }`}
        >
          {bannerImageUrl ? (
            <img
              alt={bannerAlt}
              className="block h-full w-full object-cover"
              src={bannerImageUrl}
            />
          ) : (
            <p className="text-body-default-sans text-[#1e1e1e]">
              {tag.banner ?? "Banner"}
            </p>
          )}
        </div>
      </section>

      <div className="flex w-full flex-col items-start px-[20px]">
        {/* The intro block explains what this tag means before filtering begins. */}
        <section className="flex w-full flex-col gap-[10px] py-[16px]">
          <p className="text-header-content-h1 text-[#1e1e1e]">
            {titleCase(tag.name)}
          </p>
          <div className="flex w-full items-center">
            <p className="text-body-default-sans text-[#1e1e1e]">
              {tag.description ?? ""}
            </p>
          </div>
        </section>

        {/* Filters stay close to the intro so the artwork grid can be refined immediately. */}
        <section className="flex w-full flex-col gap-[8px] border-t border-[#d9d9d9] py-[16px]">
          <p className="text-header-ui-overline text-[#757575]">
            Filters
          </p>
          <TagFilters
            movementOptions={movementOptions}
            mediumOptions={mediumOptions}
            techniqueOptions={techniqueOptions}
            selectedMovement={movementFilter?.slug ?? ""}
            selectedMedium={mediumFilter?.slug ?? ""}
            selectedTechnique={techniqueFilter?.slug ?? ""}
            movementCounts={movementCounts}
            mediumCounts={mediumCounts}
            techniqueCounts={techniqueCounts}
          />
          {invalidFilters.length > 0 ? (
            <p className="text-[12px] text-[#b91c1c] [font-family:var(--font-inter)]">
              One or more filters are invalid ({invalidFilters.join(", ")}). Showing unfiltered results for those filters.
            </p>
          ) : null}
        </section>

        {/* The artwork grid is the main payload of the tag page. */}
        <section className="flex w-full flex-col items-start justify-center">
          <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[30px]">
            {artworks.length > 0 ? (
              artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  className="flex w-full justify-start"
                  href={`/artwork/${artwork.slug ?? artwork.id}`}
                >
                  <ArtworkCardSmall
                    title={artwork.title}
                    artistName={artwork.artists?.name ?? "Unknown artist"}
                    imageUrl={artwork.image_url ? getGridImageUrl(artwork.image_url) : null}
                    imageAlt={artwork.title}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-2 flex w-full flex-col items-center gap-[12px] py-[24px] text-center">
                <p className="text-[16px] text-[#757575] [font-family:var(--font-inter)]">
                  No results match these filters.
                </p>
                <Link
                  className="rounded-full border border-[#d9d9d9] bg-white px-[16px] py-[8px] text-[14px] font-medium text-black [font-family:var(--font-inter)]"
                  href={`/tag/${tag.slug}`}
                >
                  Clear filters
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
