import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { ArtworkFull } from "@/components/artwork-full";
import { HomeTopBar } from "@/components/home-top-bar";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { MovementCardSmall } from "@/components/movement-card-small";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ArtworkRow = {
  id: string;
  slug: string | null;
  title: string;
  image_url: string | null;
};

type TagRow = {
  id: string;
  slug: string | null;
  name: string;
};

const ARTWORK_OF_THE_DAY_SLUG =
  "woman-with-a-parasol-madame-monet-and-her-son-claude-monet";
const MOVEMENT_OF_THE_WEEK_SLUG = "impressionism";
const HOME_OMITTED_ARTWORK_TITLES = new Set(["the origin of the world"]);

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
      row.image_url === undefined)
  );
}

function parseArtworkRows(value: unknown): ArtworkRow[] {
  return Array.isArray(value) ? value.filter(isArtworkRow) : [];
}

function isTagRow(value: unknown): value is TagRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (typeof row.slug === "string" || row.slug === null || row.slug === undefined)
  );
}

function parseTagRows(value: unknown): TagRow[] {
  return Array.isArray(value) ? value.filter(isTagRow) : [];
}

function isRelatedArtist(value: unknown): value is {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
} {
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

function getRelatedArtist(value: unknown) {
  if (Array.isArray(value)) {
    return value.find(isRelatedArtist) ?? null;
  }
  return isRelatedArtist(value) ? value : null;
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

function formatTagLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isAllowedHomeArtwork(artwork: ArtworkRow) {
  return !HOME_OMITTED_ARTWORK_TITLES.has(artwork.title.trim().toLowerCase());
}

export default async function Home() {
  noStore();
  const supabase = createSupabaseServerClient();

  const [
    { data: artworkOfDay, error: artworkError },
    { data: movementOfWeek, error: movementError },
    { data: emotionTags, error: emotionError },
  ] = await Promise.all([
    supabase
      .from("artworks")
      .select("id,slug,title,image_url,year,artists(id,name,slug,image_url)")
      .eq("slug", ARTWORK_OF_THE_DAY_SLUG)
      .maybeSingle(),
    supabase
      .from("movements")
      .select("id,name,slug,start_year,end_year,summary,icon_url")
      .eq("slug", MOVEMENT_OF_THE_WEEK_SLUG)
      .maybeSingle(),
    supabase
      .from("tags")
      .select("id,slug,name")
      .eq("category", "emotion")
      .order("name"),
  ]);

  if (artworkError) {
    throw new Error(artworkError.message);
  }
  if (movementError) {
    throw new Error(movementError.message);
  }
  if (emotionError) {
    throw new Error(emotionError.message);
  }

  let movementArtworks: ArtworkRow[] = [];
  if (movementOfWeek?.id) {
    const { data } = await supabase
      .from("artworks")
      .select("id,slug,title,image_url")
      .eq("movement_id", movementOfWeek.id)
      .order("year", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true })
      .limit(8);
    movementArtworks = parseArtworkRows(data).filter(isAllowedHomeArtwork).slice(0, 6);
  }

  const movementYears = formatMovementYears(
    movementOfWeek?.start_year ?? null,
    movementOfWeek?.end_year ?? null,
  );
  const movementImage = resolveMovementImage(
    movementOfWeek?.slug ?? null,
    movementOfWeek?.icon_url ?? null,
  );
  const movementSlugOrId = movementOfWeek?.slug ?? movementOfWeek?.id ?? null;
  const movementHref = movementSlugOrId ? `/movement/${movementSlugOrId}` : null;
  const fallbackArtworks = [
    { id: "placeholder-1", slug: null, title: "Artwork Title", image_url: null },
    { id: "placeholder-2", slug: null, title: "Artwork Title", image_url: null },
    { id: "placeholder-3", slug: null, title: "Artwork Title", image_url: null },
    { id: "placeholder-4", slug: null, title: "Artwork Title", image_url: null },
    { id: "placeholder-5", slug: null, title: "Artwork Title", image_url: null },
    { id: "placeholder-6", slug: null, title: "Artwork Title", image_url: null },
  ];
  const resolvedArtworks =
    movementArtworks.length > 0
      ? movementArtworks
      : fallbackArtworks;
  const resolvedEmotionTags = parseTagRows(emotionTags);

  const artworkSlugOrId = artworkOfDay?.slug ?? artworkOfDay?.id ?? null;
  const artworkHref = artworkSlugOrId ? `/artwork/${artworkSlugOrId}` : null;
  const artworkArtist = getRelatedArtist(artworkOfDay?.artists);
  const artistHref = artworkArtist?.slug ?? artworkArtist?.id
    ? `/artist/${artworkArtist?.slug ?? artworkArtist?.id}`
    : null;

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-white">
      <HomeTopBar />

      <div className="flex w-full flex-col gap-[32px] pb-[32px] pt-[100px]">
        <section className="flex w-full flex-col gap-[12px]">
          <div className="flex flex-col gap-[8px] px-[20px]">
            <p className="text-header-ui-page text-[#1e1e1e]">
              Welcome
            </p>
            <p className="text-header-ui-overline text-[#757575]">
              Artwork of the day
            </p>
          </div>
          <ArtworkFull
            className="w-full"
            frameClassName="w-full"
            artworkHref={artworkHref}
            title={artworkOfDay?.title ?? "Artwork Title"}
            year={artworkOfDay?.year ?? "0000"}
            imageUrl={artworkOfDay?.image_url ?? null}
            imageAlt={artworkOfDay?.title ?? "Artwork of the day"}
            artist={{
              name: artworkArtist?.name ?? "Artist Name",
              imageUrl: artworkArtist?.image_url ?? null,
              href: artistHref,
            }}
          />
        </section>

        <section className="flex w-full flex-col gap-[16px] px-[20px]">
          <div className="flex w-full flex-col gap-[12px]">
            <div className="flex w-full flex-col gap-0">
              <p className="text-header-ui-overline text-[#757575]">
                Movement of the week
              </p>
            </div>
            <MovementCardSmall
              name={movementOfWeek?.name ?? "Movement Name"}
              years={movementYears || undefined}
              fallbackYears="YYYY - YYYY"
              imageUrl={movementImage}
              href={movementHref ?? undefined}
              className="w-full"
            />
          </div>
          <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[30px]">
            {resolvedArtworks.map((artwork, index) => {
              const key = artwork.id ?? `artwork-${index}`;
              const href = artwork.slug ?? artwork.id ? `/artwork/${artwork.slug ?? artwork.id}` : null;
              const card = (
                <ArtworkCardSmall
                  title={artwork.title ?? "Artwork Title"}
                  imageUrl={artwork.image_url ?? null}
                  imageAlt={artwork.title ?? "Artwork"}
                  showArtistName={false}
                  className="flex w-[168.5px] flex-col items-start"
                />
              );

              return href ? (
                <Link key={key} href={href} className="flex w-[168.5px] flex-col items-start">
                  {card}
                </Link>
              ) : (
                <div key={key} className="flex w-[168.5px] flex-col items-start">
                  {card}
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex w-full flex-col gap-[12px] overflow-clip py-[32px]">
          <div className="flex w-full items-center px-[20px]">
            <p className="text-header-ui-overline text-[#757575]">
              Explore an emotion
            </p>
          </div>
          <HorizontalDragScroll className="flex w-full items-start gap-[8px] overflow-x-auto overflow-y-clip bg-white px-[20px] hide-scrollbar">
            {resolvedEmotionTags.length > 0
              ? resolvedEmotionTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug ?? tag.id}`}
                    className="flex shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] px-[14px] py-[10px]"
                  >
                    <span className="text-label-primary text-[#1e1e1e]">
                      {formatTagLabel(tag.name)}
                    </span>
                  </Link>
                ))
              : ["Emotion", "Emotion", "Emotion", "Emotion", "Emotion"].map(
                  (label, index) => (
                    <div
                      key={`emotion-placeholder-${index}`}
                      className="flex shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] px-[14px] py-[10px]"
                    >
                      <span className="text-label-primary text-[#1e1e1e]">
                        {label}
                      </span>
                    </div>
                  ),
                )}
          </HorizontalDragScroll>
        </section>
      </div>
    </div>
  );
}
