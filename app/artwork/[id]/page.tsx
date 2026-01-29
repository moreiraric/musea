import Link from "next/link";
import { ArtworkImageViewer } from "@/components/artwork-image-viewer";
import { ArtworkReflectionChat } from "@/components/artwork-reflection-chat";
import { ArtworkSlides } from "@/components/artwork-slides";
import { ArtworkTopBar } from "@/components/artwork-top-bar";
import { ArtworkFull } from "@/components/artwork-full";
import { MovementSheet } from "@/components/movement-sheet";
import { createSupabaseServerAdminClient, createSupabaseServerClient } from "@/lib/supabase";

type ArtworkPageProps = {
  params: { id: string };
};

type TagRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  short_description: string | null;
  description: string | null;
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

type EssayArtworkRow = {
  id: string;
  title: string;
  year: number | null;
  image_url: string | null;
  slug: string | null;
  artists?: { id: string; name: string; slug: string | null; image_url: string | null } | null;
};

const tagIconMap: Record<string, string> = {
  theme: "/images/ui/components_and_tags/icon-theme.png",
  emotion: "/images/ui/components_and_tags/icon-emotion.png",
  personality: "/images/ui/components_and_tags/icon-personality.png",
  technique: "/images/ui/components_and_tags/icon-technique.png",
  medium: "/images/ui/components_and_tags/icon-medium.png",
  representation: "/images/ui/components_and_tags/icon-representation.png",
};

const craftCategoryConfig = [
  {
    key: "technique",
    label: "Technique",
    icon: "/images/ui/components_and_tags/icon-technique.png",
  },
  {
    key: "medium",
    label: "Medium",
    icon: "/images/ui/components_and_tags/icon-medium.png",
  },
  {
    key: "representation",
    label: "Representation",
    icon: "/images/ui/components_and_tags/icon-representation.png",
  },
];

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export default async function ArtworkDetailPage({ params }: ArtworkPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const artworkParam = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";

  const supabase = createSupabaseServerClient();
  const adminSupabase = createSupabaseServerAdminClient();

  const artworkQuery = supabase
    .from("artworks")
    .select("id,slug,title,year,image_url,artist_id,movement_id")
    .limit(1);

  const { data: artwork, error: artworkError } = uuidRegex.test(artworkParam)
    ? await artworkQuery.eq("id", artworkParam).maybeSingle()
    : await artworkQuery.eq("slug", artworkParam).maybeSingle();

  if (artworkError) {
    throw new Error(artworkError.message);
  }

  if (!artwork) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Artwork not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No row returned for {params.id}.
        </p>
      </div>
    );
  }

  const artworkId = artwork.id;

  const movementId = artwork.movement_id;

  const [
    artistResult,
    movementResult,
    slidesResult,
    tagsResult,
    movementsResult,
    essaysResult,
  ] =
    await Promise.all([
      artwork.artist_id
        ? supabase
            .from("artists")
            .select("id,name,slug,image_url")
            .eq("id", artwork.artist_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      movementId
        ? supabase
            .from("movements")
            .select("id,name,slug,start_year,end_year,summary,icon_url")
            .eq("id", movementId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("artwork_slides")
        .select("slides,reflection_question")
        .eq("artwork_id", artworkId)
        .maybeSingle(),
      supabase
        .from("artwork_tags")
        .select("tags(id,name,slug,category,short_description,description)")
        .eq("artwork_id", artworkId),
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
    ]);


  const slides = Array.isArray(slidesResult.data?.slides)
    ? slidesResult.data?.slides
    : [];
  const reflectionQuestion = slidesResult.data?.reflection_question ?? "";

  const tags: TagRow[] = (tagsResult.data ?? [])
    .map((row) => row.tags)
    .filter(Boolean) as TagRow[];

  const normalizeCategory = (category?: string | null) =>
    (category ?? "other").toLowerCase();

  const sortedTags = [...tags].sort((a, b) => {
    const categoryCompare = normalizeCategory(a.category).localeCompare(
      normalizeCategory(b.category),
    );
    if (categoryCompare !== 0) {
      return categoryCompare;
    }
    return a.name.localeCompare(b.name);
  });

  const tagsByCategory = sortedTags.reduce<Record<string, TagRow[]>>(
    (acc, tag) => {
      const key = normalizeCategory(tag.category);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tag);
      return acc;
    },
    {},
  );

  const tagDisplayOrder = ["theme", "emotion", "personality"];
  const displayTags = tagDisplayOrder.flatMap((category) =>
    sortedTags.filter((tag) => normalizeCategory(tag.category) === category),
  );

  const craftCards = craftCategoryConfig
    .map((category) => {
      const tag = tagsByCategory[category.key]?.[0];
      if (!tag) {
        return null;
      }
      return {
        label: category.label,
        title: tag.name,
        description: tag.short_description || tag.description || "",
        icon: category.icon,
      };
    })
    .filter(Boolean);

  if (movementsResult.error) {
    throw new Error(movementsResult.error.message);
  }

  if (essaysResult.error) {
    throw new Error(essaysResult.error.message);
  }
  const artist = artistResult.data;
  const movement = movementResult.data as MovementRow | null;
  const movements = (movementsResult.data ?? []) as MovementRow[];
  const missingStartYears = movements.filter((row) => row.start_year === null);
  if (missingStartYears.length > 0) {
    throw new Error(
      `Movements missing start_year: ${missingStartYears
        .map((row) => row.slug ?? row.id)
        .join(", ")}`,
    );
  }
  const movementYear = movement?.start_year ?? null;

  const [previousMovement, nextMovement] = await Promise.all([
    movementYear
      ? supabase
          .from("movements")
          .select("id,name,start_year")
          .lt("start_year", movementYear)
          .order("start_year", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    movementYear
      ? supabase
          .from("movements")
          .select("id,name,start_year")
          .gt("start_year", movementYear)
          .order("start_year", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const movementImage = resolveMovementImage(
    movement?.slug ?? null,
    movement?.icon_url ?? null,
  );
  const movementYears = formatMovementYears(
    movement?.start_year ?? null,
    movement?.end_year ?? null,
  );
  const movementTimeline = movements.map((row) => ({
    id: row.id,
    name: row.name,
    iconUrl: resolveMovementImage(row.slug ?? null, row.icon_url ?? null),
    isActive: row.id === movement?.id,
    href: row.slug ? `/movement/${row.slug}` : undefined,
  }));

  const essayRow = Array.isArray(essaysResult.data)
    ? ((essaysResult.data[0] ?? null) as MovementEssayRow | null)
    : null;
  if (movementId && !essayRow) {
    console.warn(`No movement_essays row found for movement_id ${movementId}`);
  }
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
    essayArtworks = (data ?? []) as EssayArtworkRow[];
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

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-white pt-[107px]">
      <ArtworkTopBar artwork={artwork} />
      <div className="mt-[16px]">
        <ArtworkFull
          title={artwork.title}
          year={artwork.year ?? ""}
          artist={
            artist
              ? {
                  name: artist.name,
                  imageUrl: artist.image_url,
                  href: `/artist/${artist.slug ?? artist.id}`,
                }
              : null
          }
          image={
            artwork.image_url ? (
              <div className="w-full bg-[#d9d9d9]">
                <ArtworkImageViewer
                  alt={artwork.title}
                  src={artwork.image_url}
                />
              </div>
            ) : (
              <div className="flex min-h-[232px] w-full items-center justify-center bg-[#d9d9d9] text-sm text-[#757575]">
                Image unavailable
              </div>
            )
          }
        />
      </div>

      <div className="flex w-full flex-col px-[20px] pb-[16px]">
        <section className="w-full border-t border-[#d9d9d9] pb-[32px] pt-[16px]">
          {slides.length > 0 ? (
            <ArtworkSlides slides={slides} />
          ) : (
            <div className="flex h-[120px] items-center justify-center text-sm text-[#757575]">
              Story coming soon.
            </div>
          )}
        </section>

        {displayTags.length > 0 ? (
          <section className="flex w-full flex-col gap-[8px] pb-[32px]">
            <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
              Tags
            </p>
            <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
              {displayTags.map((tag) => (
                <Link
                  key={tag.id}
                  className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] px-[12px] py-[8px]"
                  href={`/tag/${tag.slug ?? tag.id}`}
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-[24px] w-[24px]"
                    src={resolveTagIcon(tag)}
                  />
                  <span className="text-[16px] font-medium text-black [font-family:var(--font-inter)]">
                    {formatTagLabel(tag.name)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {reflectionQuestion ? (
          <section className="flex w-full flex-col py-[32px]">
            <ArtworkReflectionChat
              artworkId={artwork.id}
              artworkTitle={artwork.title}
              artistName={artist?.name ?? null}
              question={reflectionQuestion}
            />
          </section>
        ) : null}

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
            trigger={
              <section className="flex w-full flex-col pb-[32px] pt-[32px]">
                <div className="flex w-full flex-col gap-[8px]">
                  <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                    Movement
                  </p>
                  <div className="flex w-full flex-col items-center justify-between rounded-[32px] border border-[#d9d9d9] bg-white px-[20px] py-[16px]">
                    <div className="flex w-full flex-col items-center">
                      <div className="flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-[28px]">
                        {movementImage ? (
                          <img
                            alt={movement.name}
                            className="h-full w-full object-cover"
                            src={movementImage}
                          />
                        ) : null}
                      </div>
                      <div className="mt-0 flex w-full flex-col items-center gap-[4px] text-center">
                        <p className="text-[20px] font-semibold leading-[28px] text-black [font-family:var(--font-literata)]">
                          {movement.name}
                        </p>
                        {movementYears ? (
                          <p className="text-[14px] font-medium tracking-[-0.14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                            {movementYears}
                          </p>
                        ) : null}
                        <p className="text-[16px] leading-[26px] text-[#1e1e1e] [font-family:var(--font-literata)]">
                          {movement.summary ?? ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full items-start justify-between pb-0 pt-[16px]">
                      <button
                        className="flex items-center gap-[4px] rounded-bl-[100px] rounded-br-[4px] rounded-tl-[100px] rounded-tr-[4px] py-[8px]"
                        type="button"
                        disabled={!previousMovement.data}
                        data-movement-sheet-ignore
                      >
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-[20px] w-[20px]"
                          src="/images/ui/other/icon-caret-left.svg"
                        />
                        <span className="text-[14px] font-medium tracking-[-0.14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                          {previousMovement.data?.name ?? "Previous"}
                        </span>
                      </button>
                      <button
                        className="flex items-center gap-[4px] rounded-bl-[4px] rounded-br-[100px] rounded-tl-[4px] rounded-tr-[100px] py-[8px] pl-[16px]"
                        type="button"
                        disabled={!nextMovement.data}
                        data-movement-sheet-ignore
                      >
                        <span className="text-[14px] font-medium tracking-[-0.14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                          {nextMovement.data?.name ?? "Next"}
                        </span>
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-[20px] w-[20px]"
                          src="/images/ui/other/icon-caret-right.svg"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            }
          />
        ) : null}

        {craftCards.length > 0 ? (
          <section className="flex w-full flex-col gap-[8px] pb-[32px] pt-[32px]">
            <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
              Craft
            </p>
            <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[16px] overflow-x-auto py-[2px] pl-[20px] pr-[20px] hide-scrollbar">
              {craftCards.map((card) => (
                <article
                  key={card.label}
                  className="flex h-[300px] w-[250px] shrink-0 flex-col justify-between rounded-[16px] border border-[#d9d9d9] bg-white p-[16px]"
                >
                  <div className="flex flex-1 flex-col gap-[12px]">
                    <div className="flex flex-col gap-[12px]">
                      <p className="text-[16px] font-semibold text-[#757575] [font-family:var(--font-inter)]">
                        {card.label}
                      </p>
                      <div className="flex items-center gap-[10px]">
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-[42px] w-[42px] opacity-80"
                          src={card.icon}
                        />
                        <p className="text-[20px] font-semibold leading-[25px] text-[#1e1e1e] [font-family:var(--font-literata)]">
                          {card.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-[16px] text-[#1e1e1e] [font-family:var(--font-literata)]">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-end p-[2px]">
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-[24px] w-[24px]"
                      src="/images/ui/nav/icon-plus.svg"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
