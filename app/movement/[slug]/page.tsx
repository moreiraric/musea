import Link from "next/link";
import { ArtistPortraitAndName } from "@/components/artist-portrait";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { ArtworkFull } from "@/components/artwork-full";
import { MovementTimelineRow } from "@/components/movement-timeline-row";
import { MovementTopBar } from "@/components/movement-top-bar";
import { createSupabaseServerAdminClient, createSupabaseServerClient } from "@/lib/supabase";

type MovementPageProps = {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type MovementRow = {
  id: string;
  name: string;
  slug: string | null;
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

type MovementSummary = {
  id?: string | null;
  slug?: string | null;
  name: string;
  startYear?: number | null;
  endYear?: number | null;
  iconUrl?: string | null;
};

type MovementTimelineItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
  href?: string;
  isActive?: boolean;
};

type MovementEssay = {
  id: string;
  title: string;
  body: string;
  artwork?: {
    title: string;
    year?: number | string | null;
    imageUrl?: string | null;
    href?: string | null;
    artist?: {
      name: string;
      imageUrl?: string | null;
      href?: string | null;
    } | null;
  };
};

type MovementArtist = {
  id: string;
  name: string;
  imageUrl?: string | null;
  href?: string | null;
};

type MovementArtwork = {
  id: string;
  title: string;
  imageUrl?: string | null;
  href?: string | null;
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
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined) &&
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

function MovementEssaySection({ title, body, artwork }: MovementEssay) {
  const artworkContent = (
    <ArtworkFull
      className="w-full"
      frameClassName="w-full"
      title={artwork?.title ?? "Artwork Title"}
      year={artwork?.year ?? "0000"}
      imageUrl={artwork?.imageUrl ?? null}
      disableArtistLink={Boolean(artwork?.href)}
      artist={
        artwork?.artist ?? {
          name: "Artist Name",
          imageUrl: null,
          href: null,
        }
      }
    />
  );

  return (
    <div className="flex w-full flex-col gap-[16px]">
      <div className="flex w-full flex-col gap-[4px] px-[20px]">
        <p className="text-header-content-h2 text-black">
          {title}
        </p>
        <p className="text-body-longform-serif text-black">
          {body}
        </p>
      </div>
      {artwork?.href ? (
        <Link className="w-full" href={artwork.href}>
          {artworkContent}
        </Link>
      ) : (
        artworkContent
      )}
    </div>
  );
}

function getThumbnailUrl(url?: string | null) {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes("/storage/v1/render/image/")) {
      parsed.searchParams.set("width", "400");
      parsed.searchParams.set("quality", "80");
      parsed.searchParams.set("resize", "contain");
      return parsed.toString();
    }
    if (parsed.pathname.includes("/storage/v1/object/public/")) {
      parsed.pathname = parsed.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/",
      );
      parsed.searchParams.set("width", "400");
      parsed.searchParams.set("quality", "80");
      parsed.searchParams.set("resize", "contain");
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export default async function MovementPage({ params, searchParams }: MovementPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const movementParam = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
  const fromParam =
    typeof searchParams?.from === "string"
      ? decodeURIComponent(searchParams.from)
      : "";

  const supabase = createSupabaseServerClient();
  const adminSupabase = createSupabaseServerAdminClient();

  const movementQuery = supabase
    .from("movements")
    .select("id,name,slug,start_year,end_year,summary,icon_url")
    .limit(1);

  const { data: movement, error: movementError } = uuidRegex.test(movementParam)
    ? await movementQuery.eq("id", movementParam).maybeSingle()
    : await movementQuery.eq("slug", movementParam).maybeSingle();

  if (movementError) {
    throw new Error(movementError.message);
  }

  if (!movement) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Movement not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No row returned for {params.slug}.
        </p>
      </div>
    );
  }

  const movementId = movement.id;

  const [movementsResult, essaysResult, movementArtistsResult, movementArtworksResult] =
    await Promise.all([
      supabase
        .from("movements")
        .select("id,name,slug,start_year,icon_url")
        .order("start_year", { ascending: true }),
      adminSupabase
        .from("movement_essays")
        .select(
          "p1_title,p1_text,p1_artwork_id,p2_title,p2_text,p2_artwork_id,p3_title,p3_text,p3_artwork_id",
        )
        .eq("movement_id", movementId)
        .order("created_at", { ascending: false })
        .limit(1),
      adminSupabase
        .from("artworks")
        .select("artists(id,name,slug,image_url)")
        .eq("movement_id", movementId),
      adminSupabase
        .from("artworks")
        .select("id,title,image_url,slug,year")
        .eq("movement_id", movementId)
        .order("year", { ascending: true, nullsFirst: false })
        .order("title", { ascending: true }),
    ]);

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

  const movements = parseMovementRows(movementsResult.data);
  const missingStartYears = movements.filter((row) => row.start_year === null);
  if (missingStartYears.length > 0) {
    throw new Error(
      `Movements missing start_year: ${missingStartYears
        .map((row) => row.slug ?? row.id)
        .join(", ")}`,
    );
  }

  const movementYears = formatMovementYears(movement.start_year, movement.end_year);
  const movementImage = resolveMovementImage(movement.slug ?? null, movement.icon_url ?? null);

  const movementTimeline: MovementTimelineItem[] = movements.map((row) => ({
    id: row.id,
    name: row.name,
    iconUrl: resolveMovementImage(row.slug ?? null, row.icon_url ?? null),
    isActive: row.id === movement.id,
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

  const movementEssays: MovementEssay[] | undefined = essayRow
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
  const movementArtistCards: MovementArtist[] = Array.from(uniqueArtists.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((artistRow) => ({
      id: artistRow.id,
      name: artistRow.name,
      imageUrl: artistRow.image_url,
      href: artistRow.slug ? `/artist/${artistRow.slug}` : `/artist/${artistRow.id}`,
    }));

  const movementArtworks = parseMovementArtworkRows(movementArtworksResult.data);
  const movementArtworkCards: MovementArtwork[] = movementArtworks.map((artworkRow) => ({
    id: artworkRow.id,
    title: artworkRow.title,
    imageUrl: artworkRow.image_url,
    href: `/artwork/${artworkRow.slug ?? artworkRow.id}`,
  }));

  const resolvedTimeline: MovementTimelineItem[] = movementTimeline.length
    ? movementTimeline
    : [
        {
          id: movement.id ?? "movement-current",
          name: movement.name,
          iconUrl: movementImage ?? null,
          isActive: true,
        },
      ];
  const timelineWithReturn = resolvedTimeline.map((item) => ({
    ...item,
    href:
      fromParam && item.href
        ? `${item.href}${item.href.includes("?") ? "&" : "?"}from=${encodeURIComponent(fromParam)}`
        : item.href,
  }));

  const resolvedEssays =
    movementEssays && movementEssays.some((essay) => essay.title.trim() || essay.body.trim())
      ? movementEssays
      : [
          { id: "movement-essay-1", title: "Title", body: "This is a paragraph." },
          { id: "movement-essay-2", title: "Title", body: "This is a paragraph." },
          { id: "movement-essay-3", title: "Title", body: "This is a paragraph." },
        ];

  const resolvedArtists = movementArtistCards.length
    ? movementArtistCards
    : [
        { id: "movement-artist-1", name: "lastname" },
        { id: "movement-artist-2", name: "lastname" },
        { id: "movement-artist-3", name: "lastname" },
        { id: "movement-artist-4", name: "lastname" },
      ];

  const resolvedArtworks = movementArtworkCards.length
    ? movementArtworkCards
    : [
        { id: "movement-artwork-1", title: "Artwork" },
        { id: "movement-artwork-2", title: "Artwork" },
        { id: "movement-artwork-3", title: "Artwork" },
        { id: "movement-artwork-4", title: "Artwork" },
      ];

  const movementSummary: MovementSummary = {
    id: movement.id,
    slug: movement.slug,
    name: movement.name,
    startYear: movement.start_year,
    endYear: movement.end_year,
    iconUrl: movementImage,
  };

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-white pt-[100px]">
      <MovementTopBar
        backHref={fromParam || undefined}
        forceBackHref={Boolean(fromParam)}
      />

      <div className="flex w-full flex-col gap-[32px] pb-[32px] pt-[20px]">
        <div className="flex flex-col items-center gap-0">
          <div className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden">
            {movementSummary.iconUrl ? (
              <img
                alt={movementSummary.name}
                className="h-full w-full object-cover"
                src={movementSummary.iconUrl}
              />
            ) : null}
          </div>
          <div className="flex flex-col items-center gap-[12px]">
            <p className="text-header-content-h2 text-[#1e1e1e]">
              {movementSummary.name}
            </p>
            {movementYears ? (
              <div className="text-meta-large flex items-center gap-[4px] text-[#757575]">
                {movementSummary.startYear ? <span>{movementSummary.startYear}</span> : null}
                {movementSummary.startYear && movementSummary.endYear ? <span>-</span> : null}
                {movementSummary.endYear ? <span>{movementSummary.endYear}</span> : null}
              </div>
            ) : null}
          </div>
        </div>

        <MovementTimelineRow items={timelineWithReturn} />
      </div>

      <section className="flex w-full flex-col gap-[8px] overflow-hidden pb-[32px] pt-0">
        <div className="flex w-full items-center px-[20px]">
          <p className="text-header-ui-overline text-[#757575]">
            About
          </p>
        </div>
        <div className="flex w-full flex-col gap-[32px]">
          {resolvedEssays.map((essay) => (
            <MovementEssaySection key={essay.id} {...essay} />
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
        <div className="flex items-end py-[8px]">
          <p className="text-header-ui-overline text-[#757575]">
            Artists
          </p>
        </div>
        <div className="-mx-[20px] flex w-[calc(100%+40px)] items-start gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
          {resolvedArtists.map((artist) => (
            <ArtistPortraitAndName key={artist.id} {...artist} />
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-[8px] px-[20px] py-[32px]">
        <div className="flex items-end py-[8px]">
          <p className="text-header-ui-overline text-[#757575]">
            Artworks
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-[20px] gap-y-[30px]">
          {resolvedArtworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={artwork.href ?? "#"}
              className={artwork.href ? "block" : "pointer-events-none"}
            >
              <ArtworkCardSmall
                title={artwork.title}
                imageUrl={getThumbnailUrl(artwork.imageUrl ?? null)}
                imageAlt={artwork.title}
                showArtistName={false}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
