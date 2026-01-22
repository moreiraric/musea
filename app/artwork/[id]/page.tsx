import { ArtworkSlides } from "@/components/artwork-slides";
import { createSupabaseServerClient } from "@/lib/supabase";

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
  const artworkId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";

  if (!uuidRegex.test(artworkId)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Invalid artwork id</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route id was {artworkId || "(empty)"}.
        </p>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: artwork, error: artworkError } = await supabase
    .from("artworks")
    .select("id,title,year,image_url,artist_id,movement_id")
    .eq("id", artworkId)
    .maybeSingle();

  if (artworkError) {
    throw new Error(artworkError.message);
  }

  if (!artwork) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Artwork not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No row returned for id {params.id}.
        </p>
      </div>
    );
  }

  const [artistResult, movementResult, slidesResult, tagsResult] =
    await Promise.all([
      artwork.artist_id
        ? supabase
            .from("artists")
            .select("id,name,slug,image_url")
            .eq("id", artwork.artist_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      artwork.movement_id
        ? supabase
            .from("movements")
            .select("id,name,slug,start_year,end_year,summary,icon_url")
            .eq("id", artwork.movement_id)
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
    ]);

  const slides = Array.isArray(slidesResult.data?.slides)
    ? slidesResult.data?.slides
    : [];
  const reflectionQuestion = slidesResult.data?.reflection_question ?? "";

  const tags: TagRow[] = (tagsResult.data ?? [])
    .map((row) => row.tags)
    .filter(Boolean) as TagRow[];

  const sortedTags = [...tags].sort((a, b) => {
    const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "");
    if (categoryCompare !== 0) {
      return categoryCompare;
    }
    return a.name.localeCompare(b.name);
  });

  const tagsByCategory = sortedTags.reduce<Record<string, TagRow[]>>(
    (acc, tag) => {
      const key = tag.category ?? "other";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tag);
      return acc;
    },
    {},
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

  const artist = artistResult.data;
  const movement = movementResult.data;

  const movementImage = resolveMovementImage(
    movement?.slug ?? null,
    movement?.icon_url ?? null,
  );
  const movementYears = formatMovementYears(
    movement?.start_year ?? null,
    movement?.end_year ?? null,
  );

  return (
    <div className="flex w-full flex-col bg-white">
      <section className="flex w-full min-h-[393px] items-center justify-center bg-[#f5f5f5] px-[20px] py-[20px]">
        {artwork.image_url ? (
          <div className="w-full bg-[#d9d9d9]">
            <img
              alt={artwork.title}
              className="h-auto w-full"
              src={artwork.image_url}
            />
          </div>
        ) : (
          <div className="flex min-h-[232px] w-full items-center justify-center bg-[#d9d9d9] text-sm text-[#757575]">
            Image unavailable
          </div>
        )}
      </section>

      <div className="flex w-full flex-col px-[20px] pb-[16px]">
        <div className="flex w-full flex-col gap-[16px] pb-[16px] pt-[8px]">
          <div className="flex items-center">
            <h1 className="text-[24px] font-semibold text-black [font-family:var(--font-literata)]">
              {artwork.title}
            </h1>
          </div>

          <div className="flex w-full items-center justify-between">
            {artist ? (
              <div className="flex items-center gap-[12px] rounded-full bg-[#f5f5f5] pl-[8px] pr-[16px] py-[8px]">
                <div className="h-[32px] w-[24px] overflow-hidden rounded-full bg-[#d9d9d9]">
                  {artist.image_url ? (
                    <img
                      alt={artist.name}
                      className="h-full w-full object-cover"
                      src={artist.image_url}
                    />
                  ) : (
                    <div className="h-full w-full bg-[#d9d9d9]" />
                  )}
                </div>
                <p className="text-[16px] text-black tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
                  {artist.name}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-[12px] rounded-full bg-[#f5f5f5] px-[16px] py-[8px]">
                <p className="text-[16px] text-[#757575] [font-family:var(--font-jetbrains-mono)]">
                  Unknown artist
                </p>
              </div>
            )}
            <p className="text-[16px] text-[#757575] tracking-[-0.16px] [font-family:var(--font-jetbrains-mono)]">
              {artwork.year ?? ""}
            </p>
          </div>
        </div>

        <section className="w-full border-t border-[#d9d9d9] pb-[32px] pt-[16px]">
          {slides.length > 0 ? (
            <ArtworkSlides slides={slides} />
          ) : (
            <div className="flex h-[120px] items-center justify-center text-sm text-[#757575]">
              Story coming soon.
            </div>
          )}
        </section>

        {sortedTags.length > 0 ? (
          <section className="flex w-full flex-col gap-[8px] pb-[32px]">
            <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
              Tags
            </p>
            <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[8px] overflow-x-auto pb-[4px] pl-[20px] pr-[20px] hide-scrollbar">
              {sortedTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex shrink-0 items-center gap-[8px] rounded-full border border-[#d9d9d9] px-[12px] py-[8px]"
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-[24px] w-[24px]"
                    src={resolveTagIcon(tag)}
                  />
                  <span className="text-[16px] font-medium text-black [font-family:var(--font-inter)]">
                    {tag.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {reflectionQuestion ? (
          <section className="flex w-full flex-col py-[32px]">
            <button
              className="flex w-full items-center rounded-full border border-[#0296ed] bg-[#f5f5f5] px-[20px] py-[16px] text-left shadow-[0px_1px_10px_rgba(4,98,153,0.15),0px_-1px_10px_rgba(221,98,249,0.15)]"
              type="button"
            >
              <span className="text-[16px] text-[#707070] [font-family:var(--font-instrument-sans)]">
                {reflectionQuestion}
              </span>
            </button>
          </section>
        ) : null}

        {movement ? (
          <section className="flex w-full flex-col pt-[32px]">
            <div className="flex w-full flex-col gap-[8px]">
              <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
                Movement
              </p>
              <div className="flex w-full flex-col items-center justify-between rounded-[32px] border border-[#d9d9d9] bg-white px-[20px] py-[16px]">
                <div className="flex w-full flex-col items-center">
                  <div className="flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-[28px] bg-[#f5f5f5]">
                    {movementImage ? (
                      <img
                        alt={movement.name}
                        className="h-full w-full object-cover"
                        src={movementImage}
                      />
                    ) : null}
                  </div>
                  <div className="mt-[12px] flex w-full flex-col items-center gap-[4px] text-center">
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
                <div className="flex w-full items-start justify-between pb-[8px] pt-[16px]">
                  <button
                    className="flex items-center gap-[8px] rounded-bl-[100px] rounded-br-[4px] rounded-tl-[100px] rounded-tr-[4px] py-[8px]"
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-[20px] w-[20px]"
                      src="/images/ui/nav/icon-caret-left.svg"
                    />
                    <span className="text-[14px] font-medium tracking-[-0.14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                      Previous
                    </span>
                  </button>
                  <button
                    className="flex items-center gap-[8px] rounded-bl-[4px] rounded-br-[100px] rounded-tl-[4px] rounded-tr-[100px] py-[8px] pl-[16px]"
                    type="button"
                  >
                    <span className="text-[14px] font-medium tracking-[-0.14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                      Next
                    </span>
                    <img
                      alt=""
                      aria-hidden="true"
                      className="h-[20px] w-[20px] rotate-180"
                      src="/images/ui/nav/icon-caret-left.svg"
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {craftCards.length > 0 ? (
          <section className="flex w-full flex-col gap-[8px] pb-[32px] pt-[32px]">
            <p className="text-[14px] font-medium uppercase text-[#757575] [font-family:'SF_Mono',var(--font-jetbrains-mono)]">
              Craft
            </p>
            <div className="flex w-full gap-[16px] overflow-x-auto">
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
