import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { TagFilters } from "@/components/tag-filters";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { TagTopBar } from "@/components/tag-top-bar";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TagPageProps = {
  params: { slug: string };
  searchParams?: {
    movement?: string;
    medium?: string;
    technique?: string;
  };
};

type TagRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner: string | null;
  category: string;
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
      const isCommons = parsed.pathname.includes("/wikipedia/commons/");
      if (isCommons) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const commonsIndex = segments.indexOf("commons");
        const filename = segments[segments.length - 1];
        if (commonsIndex !== -1 && filename) {
          const extension = filename.split(".").pop()?.toLowerCase() ?? "";
          const needsRaster =
            extension === "svg" || extension === "tif" || extension === "tiff";
          const rasterSuffix = needsRaster ? (extension === "svg" ? ".png" : ".jpg") : "";
          const sizeSegment = `${size}px-${filename}${rasterSuffix}`;

          if (segments.includes("thumb")) {
            segments[segments.length - 1] = sizeSegment;
            parsed.pathname = `/${segments.join("/")}`;
            return parsed.toString();
          }

          const prefix = segments.slice(0, commonsIndex + 1).join("/");
          const rest = segments.slice(commonsIndex + 1).join("/");
          parsed.pathname = `/${prefix}/thumb/${rest}/${sizeSegment}`;
          return parsed.toString();
        }
      }
    }
    if (parsed.pathname.includes("/storage/v1/render/image/")) {
      parsed.searchParams.set("width", String(size));
      parsed.searchParams.set("quality", "80");
      return parsed.toString();
    }
    if (parsed.pathname.includes("/storage/v1/object/public/")) {
      parsed.pathname = parsed.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/",
      );
      parsed.searchParams.set("width", String(size));
      parsed.searchParams.set("quality", "80");
      return parsed.toString();
    }
  } catch {
    // ignore invalid URLs
  }
  return url;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function intersectIds(base: string[] | null | undefined, next?: string[] | null) {
  const safeBase = base ?? [];
  if (!next) {
    return safeBase;
  }
  const nextSet = new Set(next);
  return safeBase.filter((id) => nextSet.has(id));
}

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

  const bannerArtwork = bannerResult.data as
    | { slug: string | null; title: string; image_url: string | null }
    | null;

  const movementOptions = (movementsResult.data ?? []) as MovementRow[];
  const mediumOptions = (mediumTagsResult.data ?? []) as TagOption[];
  const techniqueOptions = (techniqueTagsResult.data ?? []) as TagOption[];

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

  const { data: baseTagRows, error: baseTagError } = await supabase
    .from("artwork_tags")
    .select("artwork_id")
    .eq("tag_id", tag.id);

  if (baseTagError) {
    throw new Error(baseTagError.message);
  }

  const baseTagArtworkIds = (baseTagRows ?? []).map(
    (row) => row.artwork_id as string,
  );

  const baseArtworksQuery = supabase
    .from("artwork_tags")
    .select("artworks!inner(id,slug,title,image_url,movement_id,year,artists(id,name,slug,image_url))")
    .eq("tag_id", tag.id);

  if (movementFilter) {
    baseArtworksQuery.eq("artworks.movement_id", movementFilter.id);
  }

  const { data: baseArtworks, error: baseArtworksError } =
    await baseArtworksQuery;

  if (baseArtworksError) {
    throw new Error(baseArtworksError.message);
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

  let artworks: ArtworkRow[] = (baseArtworks ?? [])
    .map((row) => (row as { artworks: ArtworkRow | null }).artworks)
    .filter(Boolean) as ArtworkRow[];

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

  let movementArtworkIds: string[] | null = null;
  if (movementFilter && baseTagArtworkIds.length > 0) {
    const { data: movementRows, error: movementError } = await supabase
      .from("artworks")
      .select("id")
      .in("id", baseTagArtworkIds)
      .eq("movement_id", movementFilter.id);
    if (movementError) {
      throw new Error(movementError.message);
    }
    movementArtworkIds = (movementRows ?? []).map((row) => row.id as string);
  }

  const baseForMovement = intersectIds(
    intersectIds(baseTagArtworkIds, mediumArtworkIds ?? null),
    techniqueArtworkIds ?? null,
  );

  if (baseForMovement.length > 0) {
    const { data: movementRows, error: movementError } = await supabase
      .from("artworks")
      .select("id,movement_id")
      .in("id", baseForMovement);
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

  const baseForMedium = intersectIds(
    intersectIds(baseTagArtworkIds, movementArtworkIds ?? null),
    techniqueArtworkIds ?? null,
  );

  if (baseForMedium.length > 0 && mediumOptions.length > 0) {
    const { data: mediumRows, error: mediumError } = await supabase
      .from("artwork_tags")
      .select("tag_id")
      .in("artwork_id", baseForMedium)
      .in(
        "tag_id",
        mediumOptions.map((option) => option.id),
      );
    if (mediumError) {
      throw new Error(mediumError.message);
    }
    (mediumRows ?? []).forEach((row) => {
      const tagId = row.tag_id as string;
      mediumCounts[tagId] = (mediumCounts[tagId] ?? 0) + 1;
    });
  }

  const baseForTechnique = intersectIds(
    intersectIds(baseTagArtworkIds, movementArtworkIds ?? null),
    mediumArtworkIds ?? null,
  );

  if (baseForTechnique.length > 0 && techniqueOptions.length > 0) {
    const { data: techniqueRows, error: techniqueError } = await supabase
      .from("artwork_tags")
      .select("tag_id")
      .in("artwork_id", baseForTechnique)
      .in(
        "tag_id",
        techniqueOptions.map((option) => option.id),
      );
    if (techniqueError) {
      throw new Error(techniqueError.message);
    }
    (techniqueRows ?? []).forEach((row) => {
      const tagId = row.tag_id as string;
      techniqueCounts[tagId] = (techniqueCounts[tagId] ?? 0) + 1;
    });
  }

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-white pt-[100px]">
      <TagTopBar backHref="/discover" />
      <section className="flex w-full flex-col">
        <div className="flex h-[200px] w-full items-center justify-center bg-[#f5f5f5]">
          {bannerImageUrl ? (
            <img
              alt={bannerAlt}
              className="h-full w-full object-cover"
              src={bannerImageUrl}
            />
          ) : (
            <p className="text-[16px] text-black [font-family:var(--font-inter)]">
              {tag.banner ?? "Banner"}
            </p>
          )}
        </div>
      </section>

      <div className="flex w-full flex-col items-start px-[20px]">
        <section className="flex w-full flex-col gap-[10px] pb-[20px] pt-[20px]">
          <p className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
            {titleCase(tag.name)}
          </p>
          <div className="flex w-full items-center">
            <p className="text-[16px] leading-[24px] text-[#5a5a5a] [font-family:var(--font-instrument-sans)]">
              {tag.description ?? ""}
            </p>
          </div>
        </section>

        <section className="flex w-full flex-col gap-[12px] border-t border-[#d9d9d9] pb-[16px] pt-[16px]">
          <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#8c8c8c] [font-family:var(--font-fira-mono)]">
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

        <section className="flex w-full flex-col items-start justify-center pb-[32px]">
          <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[28px]">
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
