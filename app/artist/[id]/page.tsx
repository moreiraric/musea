import Link from "next/link";
import { ArtistEssay } from "@/components/artist-essay";
import { ArtistTopBar } from "@/components/artist-top-bar";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { MovementSheet } from "@/components/movement-sheet";
import { MovementCardSmall } from "@/components/movement-card-small";
import { createSupabaseServerAdminClient, createSupabaseServerClient } from "@/lib/supabase";

type ArtistPageProps = {
  params: { id: string };
};

type TagRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
};

type ArtworkRow = {
  id: string;
  title: string;
  image_url: string | null;
  year: number | null;
  movement_id: string | null;
  slug: string | null;
  created_at: string | null;
};

type MovementRow = {
  id: string;
  name: string;
  slug: string;
  start_year: number | null;
  end_year: number | null;
  summary: string | null;
  icon_url: string | null;
};

type MovementEssayRow = {
  p1_title: string;
  p1_text: string;
  p1_artwork_id: string | null;
  p2_title: string;
  p2_text: string;
  p2_artwork_id: string | null;
  p3_title: string;
  p3_text: string;
  p3_artwork_id: string | null;
};

type RelatedArtistRow = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
};

type EssayArtworkRow = {
  id: string;
  title: string;
  year: number | null;
  image_url: string | null;
  slug: string | null;
  artists?: RelatedArtistRow | null;
};

type MovementArtistRow = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
};

type MovementArtworkRow = {
  id: string;
  title: string;
  image_url: string | null;
  slug: string | null;
  year: number | null;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const tagIconMap: Record<string, string> = {
  theme: "/images/ui/components_and_tags/icon-theme.png",
  emotion: "/images/ui/components_and_tags/icon-emotion.png",
  personality: "/images/ui/components_and_tags/icon-personality.png",
  technique: "/images/ui/components_and_tags/icon-technique.png",
  medium: "/images/ui/components_and_tags/icon-medium.png",
  representation: "/images/ui/components_and_tags/icon-representation.png",
};

const countryCodeByName: Record<string, string> = {
  Italy: "IT",
  France: "FR",
  Spain: "ES",
  Portugal: "PT",
  Germany: "DE",
  Netherlands: "NL",
  Belgium: "BE",
  "United Kingdom": "GB",
  England: "GB",
  Scotland: "GB",
  "United States": "US",
  "United States of America": "US",
  Austria: "AT",
  Switzerland: "CH",
  Russia: "RU",
};

function normalizeCategory(category?: string | null) {
  return (category ?? "other").toLowerCase();
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

function getRelatedTag(value: unknown): TagRow | null {
  if (Array.isArray(value)) {
    return value.find(isTagRow) ?? null;
  }

  return isTagRow(value) ? value : null;
}

function resolveTagIcon(tag: TagRow) {
  const normalized =
    tag.category?.toLowerCase() ||
    tag.slug?.toLowerCase() ||
    tag.name.toLowerCase();
  return tagIconMap[normalized] ?? tagIconMap.theme;
}

function formatTagLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

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

function countryToFlagEmoji(country?: string | null) {
  if (!country) {
    return "";
  }
  const trimmed = country.trim();
  const code = countryCodeByName[trimmed];
  if (!code) {
    return "";
  }
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function isRelatedArtistRow(value: unknown): value is RelatedArtistRow {
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

function getRelatedArtist(value: unknown): RelatedArtistRow | null {
  if (Array.isArray(value)) {
    return value.find(isRelatedArtistRow) ?? null;
  }

  return isRelatedArtistRow(value) ? value : null;
}

function isMovementRow(value: unknown): value is MovementRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.slug === "string" &&
    (typeof row.start_year === "number" ||
      row.start_year === null ||
      row.start_year === undefined) &&
    (typeof row.end_year === "number" ||
      row.end_year === null ||
      row.end_year === undefined) &&
    (typeof row.summary === "string" ||
      row.summary === null ||
      row.summary === undefined) &&
    (typeof row.icon_url === "string" ||
      row.icon_url === null ||
      row.icon_url === undefined)
  );
}

function parseMovementRows(value: unknown): MovementRow[] {
  return Array.isArray(value) ? value.filter(isMovementRow) : [];
}

function parseEssayArtworkRows(value: unknown): EssayArtworkRow[] {
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
      (typeof record.year !== "number" && record.year !== null && record.year !== undefined) ||
      (typeof record.image_url !== "string" &&
        record.image_url !== null &&
        record.image_url !== undefined) ||
      (typeof record.slug !== "string" && record.slug !== null && record.slug !== undefined)
    ) {
      return [];
    }

    return [
      {
        id: record.id,
        title: record.title,
        year: typeof record.year === "number" ? record.year : null,
        image_url: typeof record.image_url === "string" ? record.image_url : null,
        slug: typeof record.slug === "string" ? record.slug : null,
        artists: getRelatedArtist(record.artists),
      },
    ];
  });
}

function parseMovementArtistRows(value: unknown): MovementArtistRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }

    const artist = getRelatedArtist((row as { artists?: unknown }).artists);
    return artist ? [artist] : [];
  });
}

function isMovementArtworkRow(value: unknown): value is MovementArtworkRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    (typeof row.image_url === "string" ||
      row.image_url === null ||
      row.image_url === undefined) &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
    (typeof row.year === "number" || row.year === null || row.year === undefined)
  );
}

function parseMovementArtworkRows(value: unknown): MovementArtworkRow[] {
  return Array.isArray(value) ? value.filter(isMovementArtworkRow) : [];
}

function pickHighlightArtwork(artworks: ArtworkRow[]) {
  return artworks[2] ?? artworks[1] ?? artworks[0] ?? null;
}

const MAX_MASTERPIECES = 6;

export default async function ArtistDetailPage({ params }: ArtistPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const artistParam = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";

  const supabase = createSupabaseServerClient();
  const adminSupabase = createSupabaseServerAdminClient();

  const artistQuery = supabase
    .from("artists")
    .select("id,slug,name,image_url,life_period,country,quote,bio,primary_movement_id")
    .limit(1);

  const { data: artist, error: artistError } = uuidRegex.test(artistParam)
    ? await artistQuery.eq("id", artistParam).maybeSingle()
    : await artistQuery.eq("slug", artistParam).maybeSingle();

  if (artistError) {
    throw new Error(artistError.message);
  }

  if (!artist) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Artist not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No row returned for {params.id}.
        </p>
      </div>
    );
  }

  const { data: artworks, error: artworksError } = await supabase
    .from("artworks")
    .select("id,title,image_url,year,movement_id,slug,created_at")
    .eq("artist_id", artist.id)
    .order("year", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  if (artworksError) {
    throw new Error(artworksError.message);
  }

  const artworkList = artworks ?? [];
  const highlightArtwork = pickHighlightArtwork(artworkList);

  const movementId = artist.primary_movement_id ?? highlightArtwork?.movement_id ?? null;

  const [
    movementResult,
    tagsResult,
    movementsResult,
    essaysResult,
    movementArtistsResult,
    movementArtworksResult,
  ] = await Promise.all([
    movementId
      ? supabase
          .from("movements")
          .select("id,name,slug,start_year,end_year,summary,icon_url")
          .eq("id", movementId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    artworkList.length > 0
      ? supabase
          .from("artwork_tags")
          .select("tags(id,name,slug,category)")
          .in(
            "artwork_id",
            artworkList.map((artwork) => artwork.id),
          )
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("movements")
      .select("id,name,slug,start_year,icon_url")
      .order("start_year", { ascending: true }),
    movementId
      ? adminSupabase
          .from("movement_essays")
          .select(
            "p1_title,p1_text,p1_artwork_id,p2_title,p2_text,p2_artwork_id,p3_title,p3_text,p3_artwork_id",
          )
          .eq("movement_id", movementId)
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null, error: null }),
    movementId
      ? adminSupabase
          .from("artworks")
          .select("artists(id,name,slug,image_url)")
          .eq("movement_id", movementId)
      : Promise.resolve({ data: [], error: null }),
    movementId
      ? adminSupabase
          .from("artworks")
          .select("id,title,image_url,slug,year")
          .eq("movement_id", movementId)
          .order("year", { ascending: true, nullsFirst: false })
          .order("title", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (movementResult.error) {
    throw new Error(movementResult.error.message);
  }

  if (tagsResult.error) {
    throw new Error(tagsResult.error.message);
  }

  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }

  if (essaysResult.error) {
    throw new Error(essaysResult.error.message);
  }

  if (movementArtistsResult.error) {
    throw new Error(movementArtistsResult.error.message);
  }

  if (movementArtworksResult.error) {
    throw new Error(movementArtworksResult.error.message);
  }
  const essayRow = Array.isArray(essaysResult.data)
    ? ((essaysResult.data[0] ?? null) as MovementEssayRow | null)
    : null;
  if (movementId && !essayRow) {
    console.warn(`No movement_essays row found for movement_id ${movementId}`);
  }

  const movement = movementResult.data as MovementRow | null;
  const movements = parseMovementRows(movementsResult.data);
  const missingStartYears = movements.filter((row) => row.start_year === null);
  if (missingStartYears.length > 0) {
    throw new Error(
      `Movements missing start_year: ${missingStartYears
        .map((row) => row.slug ?? row.id)
        .join(", ")}`,
    );
  }
  const movementYears = formatMovementYears(
    movement?.start_year ?? null,
    movement?.end_year ?? null,
  );
  const movementImage = resolveMovementImage(
    movement?.slug ?? null,
    movement?.icon_url ?? null,
  );
  const movementTimeline = movements.map((row) => ({
    id: row.id,
    name: row.name,
    iconUrl: resolveMovementImage(row.slug ?? null, row.icon_url ?? null),
    isActive: row.id === movement?.id,
    href: row.slug ? `/movement/${row.slug}` : undefined,
  }));

  const essayArtworkIds = essayRow
    ? ([essayRow.p1_artwork_id, essayRow.p2_artwork_id, essayRow.p3_artwork_id].filter(
        Boolean,
      ) as string[])
    : [];
  let essayArtworks: EssayArtworkRow[] = [];
  if (essayArtworkIds.length > 0) {
    const { data, error } = await adminSupabase
      .from("artworks")
      .select("id,title,year,image_url,slug,artists(id,name,slug,image_url)")
      .in("id", essayArtworkIds);
    if (error) {
      throw new Error(error.message);
    }
    essayArtworks = parseEssayArtworkRows(data);
  }
  const essayArtworkMap = new Map(essayArtworks.map((row) => [row.id, row]));
  const movementEssays = essayRow
    ? [
        {
          id: "movement-essay-1",
          title: essayRow.p1_title,
          body: essayRow.p1_text,
          artworkId: essayRow.p1_artwork_id,
        },
        {
          id: "movement-essay-2",
          title: essayRow.p2_title,
          body: essayRow.p2_text,
          artworkId: essayRow.p2_artwork_id,
        },
        {
          id: "movement-essay-3",
          title: essayRow.p3_title,
          body: essayRow.p3_text,
          artworkId: essayRow.p3_artwork_id,
        },
      ].map((section) => {
        const artworkRow = section.artworkId
          ? essayArtworkMap.get(section.artworkId)
          : undefined;
        return {
          id: section.id,
          title: section.title,
          body: section.body,
          artwork: artworkRow
            ? {
                title: artworkRow.title,
                year: artworkRow.year,
                imageUrl: artworkRow.image_url,
                href: `/artwork/${artworkRow.slug ?? artworkRow.id}`,
                artist: artworkRow.artists
                  ? {
                      name: artworkRow.artists.name,
                      imageUrl: artworkRow.artists.image_url,
                      href: `/artist/${artworkRow.artists.slug ?? artworkRow.artists.id}`,
                    }
                  : null,
              }
            : undefined,
        };
      })
    : undefined;

  const artistRows = parseMovementArtistRows(movementArtistsResult.data);
  const uniqueArtists = new Map<string, MovementArtistRow>();
  artistRows.forEach((artistRow) => {
    uniqueArtists.set(artistRow.id, artistRow);
  });
  const movementArtistCards = Array.from(uniqueArtists.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((artistRow) => ({
      id: artistRow.id,
      name: artistRow.name,
      imageUrl: artistRow.image_url,
      href: artistRow.slug ? `/artist/${artistRow.slug}` : `/artist/${artistRow.id}`,
    }));

  const movementArtworks = parseMovementArtworkRows(movementArtworksResult.data);
  const movementArtworkCards = movementArtworks.map((artworkRow) => ({
    id: artworkRow.id,
    title: artworkRow.title,
    imageUrl: artworkRow.image_url,
    href: `/artwork/${artworkRow.slug ?? artworkRow.id}`,
  }));

  const tagCounts = new Map<string, { tag: TagRow; count: number }>();
  (tagsResult.data ?? []).forEach((row) => {
    const tag = getRelatedTag((row as { tags?: unknown }).tags);
    if (!tag) {
      return;
    }
    const existing = tagCounts.get(tag.id);
    if (existing) {
      existing.count += 1;
    } else {
      tagCounts.set(tag.id, { tag, count: 1 });
    }
  });

  const sortedTags = Array.from(tagCounts.values())
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.tag.name.localeCompare(b.tag.name);
    })
    .map((entry) => entry.tag);

  const knownForTags = sortedTags.filter((tag) =>
    ["technique", "medium", "representation"].includes(
      normalizeCategory(tag.category),
    ),
  );
  const themeTags = sortedTags.filter(
    (tag) => normalizeCategory(tag.category) === "theme",
  );

  const flagEmoji = countryToFlagEmoji(artist.country);
  const lifePeriod = artist.life_period
    ? artist.life_period.replace(/\s*-\s*/g, "-")
    : "";
  const lifePeriodParts = lifePeriod
    ? lifePeriod.split("-").map((part: string) => part.trim())
    : [];
  const hasLifePeriodRange =
    lifePeriodParts.length === 2 && lifePeriodParts[0] && lifePeriodParts[1];

  const masterpieces = artworkList.slice(0, MAX_MASTERPIECES);

  const bannerHasImage = Boolean(highlightArtwork?.image_url);
  const hasTags = knownForTags.length > 0 || themeTags.length > 0;

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-white pb-[50px]">
      <ArtistTopBar
        artistId={artist.id}
        artistSlug={artist.slug}
        artistName={artist.name}
      />
      <section className="relative h-[314px] w-full shrink-0 overflow-hidden">
        <div
          className={`flex h-[250px] w-full items-center justify-center overflow-hidden bg-[#f5f5f5] ${
            bannerHasImage ? "" : "px-[32px] py-[10px]"
          }`}
        >
          {highlightArtwork?.image_url ? (
            <Link
              className="block h-full w-full"
              href={`/artwork/${highlightArtwork.slug ?? highlightArtwork.id}`}
            >
              <img
                alt={highlightArtwork.title}
                className="h-full w-full object-cover object-center"
                src={highlightArtwork.image_url}
              />
            </Link>
          ) : (
            <p className="text-body-default-sans text-black">
              highlight piece
            </p>
          )}
        </div>
        <div className="absolute left-[20px] top-[187px] h-[125px] w-[83px] overflow-hidden rounded-[1000px] border-2 border-white bg-[#d9d9d9]">
          {artist.image_url ? (
            <img
              alt={artist.name}
              className="h-full w-full object-cover"
              src={artist.image_url}
            />
          ) : null}
        </div>
      </section>

      <div className="flex w-full flex-col gap-[16px] px-[20px] pb-[32px]">
        <section className="flex w-full flex-col gap-[16px] pt-[8px]">
          <p className="text-header-content-h1 text-black">
            {artist.name}
          </p>
          <div className="flex w-full items-center justify-between gap-[12px] text-[#757575]">
            {hasLifePeriodRange ? (
              <p className="text-meta-large flex items-center gap-[4px] text-[#757575]">
                <span>{lifePeriodParts[0]}</span>
                <span>-</span>
                <span>{lifePeriodParts[1]}</span>
              </p>
            ) : (
              <p className="text-meta-large text-[#757575]">
                {lifePeriod}
              </p>
            )}
            {artist.country ? (
              <div className="flex shrink-0 items-center justify-end gap-[8px]">
                {flagEmoji ? (
                  <span className="text-[24px] font-medium [font-family:var(--font-inter)]">
                    {flagEmoji}
                  </span>
                ) : null}
                <span className="text-meta-large text-[#757575]">
                  {artist.country}
                </span>
              </div>
            ) : null}
          </div>
          {artist.quote ? (
            <p className="text-body-default-sans text-[#757575]">
              “{artist.quote}”
            </p>
          ) : null}
        </section>

        {movement ? (
          <MovementSheet
            movement={{
              id: movement.id,
              slug: movement.slug,
              name: movement.name,
              startYear: movement.start_year,
              endYear: movement.end_year,
              iconUrl: movementImage,
            }}
            timeline={movementTimeline}
            essays={movementEssays}
            artists={movementArtistCards}
            artworks={movementArtworkCards}
            trigger={
              <MovementCardSmall
                name={movement.name}
                years={movementYears}
                imageUrl={movementImage}
                className="w-full"
              />
            }
          />
        ) : null}

        {hasTags ? (
          <section className="flex w-full flex-col gap-[16px] pt-[16px]">
            {knownForTags.length > 0 ? (
              <div className="flex w-full flex-col gap-[8px]">
                <p className="text-header-ui-overline text-[#757575]">
                  Known For
                </p>
                <HorizontalDragScroll className="-mx-[20px] flex w-[calc(100%+40px)] gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
                  {knownForTags.map((tag) => (
                    <Link
                      key={tag.id}
                      className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-white pl-[12px] pr-[16px] py-[8px]"
                      href={`/tag/${tag.slug ?? tag.id}`}
                    >
                      <img
                        alt=""
                        aria-hidden="true"
                        className="h-[24px] w-[24px]"
                        src={resolveTagIcon(tag)}
                      />
                      <span className="text-label-primary text-black">
                        {formatTagLabel(tag.name)}
                      </span>
                    </Link>
                  ))}
                </HorizontalDragScroll>
              </div>
            ) : null}

            {themeTags.length > 0 ? (
              <div className="flex w-full flex-col gap-[8px]">
                <p className="text-header-ui-overline text-[#757575]">
                  Themes
                </p>
                <HorizontalDragScroll className="-mx-[20px] flex w-[calc(100%+40px)] gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
                  {themeTags.map((tag) => (
                    <Link
                      key={tag.id}
                      className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-white pl-[12px] pr-[16px] py-[8px]"
                      href={`/tag/${tag.slug ?? tag.id}`}
                    >
                      <img
                        alt=""
                        aria-hidden="true"
                        className="h-[24px] w-[24px]"
                        src={resolveTagIcon(tag)}
                      />
                      <span className="text-label-primary text-black">
                        {formatTagLabel(tag.name)}
                      </span>
                    </Link>
                  ))}
                </HorizontalDragScroll>
              </div>
            ) : null}
          </section>
        ) : null}

        {artist.bio ? (
          <section className="flex w-full flex-col gap-[4px] border-t border-[#d9d9d9] pt-[16px]">
            <p className="text-header-ui-overline text-[#757575]">
              About
            </p>
            <ArtistEssay text={artist.bio} />
          </section>
        ) : null}

        {masterpieces.length > 0 ? (
          <section className="flex w-full flex-col gap-[8px] pt-[16px]">
            <p className="text-header-ui-page text-[#1e1e1e]">
              Masterpieces
            </p>
            <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[30px]">
              {masterpieces.map((artwork) => (
                <Link
                  key={artwork.id}
                  className="flex w-[168.5px] flex-col items-start"
                  href={`/artwork/${artwork.slug ?? artwork.id}`}
                >
                  <ArtworkCardSmall
                    title={artwork.title}
                    artistName={artist.name}
                    showArtistName={false}
                    imageUrl={artwork.image_url}
                    imageAlt={artwork.title}
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
