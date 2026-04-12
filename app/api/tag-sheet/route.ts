// Tag sheet API used by the craft-card overlay on artwork pages.
// It resolves a tag, its banner artwork, and a grid of related artworks.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Validates joined artist data returned inside artwork rows.
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

// Normalizes joined artist data regardless of Supabase array shape.
function getRelatedArtist(value: unknown) {
  if (Array.isArray(value)) {
    return value.find(isRelatedArtist) ?? null;
  }
  return isRelatedArtist(value) ? value : null;
}

// Parses the nested artwork rows returned by the artwork_tags join.
function parseArtworks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }
    const artwork = (row as { artworks?: unknown }).artworks;
    if (!artwork || typeof artwork !== "object") {
      return [];
    }
    const record = artwork as Record<string, unknown>;
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

// Returns the data needed to render a tag sheet overlay.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slug") ?? "";
  const normalized = decodeURIComponent(raw).trim().toLowerCase();
  if (!normalized) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

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

  // Try slug first, then case-insensitive slug, then a name guess from the URL text.
  const { data: tag, error: tagError } = tagResult;
  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const bannerResult = tag.banner
    ? uuidRegex.test(tag.banner)
      ? await supabase
          .from("artworks")
          .select("slug,title,image_url")
          .eq("id", tag.banner)
          .maybeSingle()
      : await supabase
          .from("artworks")
          .select("slug,title,image_url")
          .eq("slug", tag.banner)
          .maybeSingle()
    : { data: null, error: null };

  if (bannerResult.error) {
    return NextResponse.json({ error: bannerResult.error.message }, { status: 500 });
  }

  const artworksResult = await supabase
    .from("artwork_tags")
    .select("artworks!inner(id,slug,title,image_url,year,artists(id,name,slug,image_url))")
    .eq("tag_id", tag.id)
    .order("year", { ascending: true, nullsFirst: false, foreignTable: "artworks" })
    .order("title", { ascending: true, foreignTable: "artworks" })
    .limit(24);

  if (artworksResult.error) {
    return NextResponse.json({ error: artworksResult.error.message }, { status: 500 });
  }

  const artworks = parseArtworks(artworksResult.data);

  return NextResponse.json({
    tag,
    bannerArtwork: bannerResult.data ?? null,
    artworks,
  });
}
