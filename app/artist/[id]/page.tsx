import Link from "next/link";
import { ArtistEssay } from "@/components/artist-essay";
import { ArtworkFrameSmall } from "@/components/artwork-frame-small";
import { createSupabaseServerClient } from "@/lib/supabase";

type ArtistPageProps = {
  params: { id: string };
};

type TagRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
};

type ArtistRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  life_period: string | null;
  country: string | null;
  quote: string | null;
  bio: string | null;
  primary_movement_id: string | null;
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

function pickHighlightArtwork(artworks: ArtworkRow[]) {
  const withYear = artworks.find((artwork) => artwork.year !== null);
  if (withYear) {
    return withYear;
  }
  const byCreated = [...artworks].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
  return byCreated[0] ?? null;
}

export default async function ArtistDetailPage({ params }: ArtistPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const artistParam = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";

  const supabase = createSupabaseServerClient();

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
    .order("title", { ascending: true })
    .limit(24);

  if (artworksError) {
    throw new Error(artworksError.message);
  }

  const artworkList = artworks ?? [];
  const highlightArtwork = pickHighlightArtwork(artworkList);

  const movementId = artist.primary_movement_id ?? highlightArtwork?.movement_id ?? null;

  const [movementResult, tagsResult] = await Promise.all([
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
  ]);

  if (movementResult.error) {
    throw new Error(movementResult.error.message);
  }

  if (tagsResult.error) {
    throw new Error(tagsResult.error.message);
  }

  const movement = movementResult.data as MovementRow | null;
  const movementYears = formatMovementYears(
    movement?.start_year ?? null,
    movement?.end_year ?? null,
  );
  const movementImage = resolveMovementImage(
    movement?.slug ?? null,
    movement?.icon_url ?? null,
  );

  const tagCounts = new Map<string, { tag: TagRow; count: number }>();
  (tagsResult.data ?? []).forEach((row) => {
    const tag = (row as { tags: TagRow | null }).tags;
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

  const masterpieces = artworkList
    .filter((artwork) => artwork.id !== highlightArtwork?.id)
    .slice(0, 6);

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-white">
      <section className="relative w-full">
        <div className="flex h-[193px] w-full items-center justify-center overflow-hidden bg-[#f5f5f5]">
          {highlightArtwork?.image_url ? (
            <Link
              className="h-full w-full"
              href={`/artwork/${highlightArtwork.slug ?? highlightArtwork.id}`}
            >
              <img
                alt={highlightArtwork.title}
                className="h-full w-full object-cover"
                src={highlightArtwork.image_url}
              />
            </Link>
          ) : (
            <p className="text-[16px] text-black [font-family:var(--font-inter)]">
              Highlight piece
            </p>
          )}
        </div>
        <div
          className="absolute left-[16px] top-[111px] h-[140px] w-[100px] overflow-hidden border-2 border-white bg-[#d9d9d9] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          style={{ borderRadius: "50% / 50%" }}
        >
          {artist.image_url ? (
            <img
              alt={artist.name}
              className="h-full w-full object-cover"
              src={artist.image_url}
            />
          ) : null}
        </div>
      </section>

      <div className="flex w-full flex-col px-[20px] pt-[53px]">
        <section className="flex w-full flex-col gap-[8px] py-[16px]">
          <p className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
            {artist.name}
          </p>
          <div className="flex w-full items-center justify-between text-[18px] font-medium text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
            <p>{artist.life_period ?? ""}</p>
            {artist.country ? (
              <div className="flex items-center gap-[8px]">
                {flagEmoji ? <span className="text-[24px]">{flagEmoji}</span> : null}
                <span>{artist.country}</span>
              </div>
            ) : null}
          </div>
          {artist.quote ? (
            <p className="text-[16px] font-medium text-[#757575] [font-family:var(--font-inter)]">
              “{artist.quote}”
            </p>
          ) : null}
        </section>

        {movement ? (
          <section className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-[8px]">
              <div className="flex w-full items-center justify-between rounded-[24px] border border-[#d9d9d9] bg-white px-[4px] py-0">
                <div className="flex items-center gap-[6px]">
                  <div className="flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-[20px]">
                    {movementImage ? (
                      <img
                        alt={movement.name}
                        className="h-full w-full object-cover"
                        src={movementImage}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <p className="text-[18px] font-semibold text-[#1e1e1e] [font-family:var(--font-literata)]">
                      {movement.name}
                    </p>
                    {movementYears ? (
                      <p className="text-[16px] text-[#757575] [font-family:var(--font-jetbrains-mono)]">
                        {movementYears}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {knownForTags.length > 0 || themeTags.length > 0 ? (
          <section className="flex w-full flex-col gap-[16px] py-[16px]">
            {knownForTags.length > 0 ? (
              <div className="flex w-full flex-col gap-[8px]">
                <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                  Known For
                </p>
                <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[16px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
                  {knownForTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent px-[12px] py-[8px]"
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
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {themeTags.length > 0 ? (
              <div className="flex w-full flex-col gap-[8px]">
                <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                  Themes
                </p>
                <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[16px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
                  {themeTags.map((tag) => (
                    <Link
                      key={tag.id}
                      className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent px-[12px] py-[8px]"
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
              </div>
            ) : null}
          </section>
        ) : null}

        {artist.bio ? (
          <section className="flex w-full border-t border-[#d9d9d9] pb-[32px] pt-[16px]">
            <ArtistEssay text={artist.bio} />
          </section>
        ) : null}

        {masterpieces.length > 0 ? (
          <section className="flex w-full flex-col gap-[16px] pb-[32px]">
            <p className="text-[24px] font-semibold text-black [font-family:var(--font-inter)]">
              Masterpieces
            </p>
            <div className="grid w-full grid-cols-2 justify-items-center gap-[16px]">
              {masterpieces.map((artwork) => (
                <Link
                  key={artwork.id}
                  className="flex w-full justify-center"
                  href={`/artwork/${artwork.slug ?? artwork.id}`}
                >
                  <ArtworkFrameSmall
                    imageUrl={artwork.image_url}
                    alt={artwork.title}
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
