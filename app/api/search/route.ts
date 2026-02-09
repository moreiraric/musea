import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { buildSearchFilter, buildSearchTokens } from "@/lib/search-utils";

export const runtime = "nodejs";

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const artworkOffset = clampNumber(Number(searchParams.get("artworkOffset")), 0, 5000);
  const artistOffset = clampNumber(Number(searchParams.get("artistOffset")), 0, 5000);
  const artworkLimit = clampNumber(Number(searchParams.get("artworkLimit")), 0, 50);
  const artistLimit = clampNumber(Number(searchParams.get("artistLimit")), 0, 50);

  if (!query) {
    return Response.json({
      artworks: [],
      artists: [],
      hasMoreArtworks: false,
      hasMoreArtists: false,
    });
  }

  const supabase = createSupabaseServerClient();
  const tokens = buildSearchTokens(query);
  const titleFilter = buildSearchFilter(tokens, ["title"]);
  const artistFilter = buildSearchFilter(tokens, ["name"]);
  let matchingArtistIds: string[] = [];

  if (artistFilter) {
    const { data, error } = await supabase
      .from("artists")
      .select("id")
      .or(artistFilter)
      .limit(5000);

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    const rows = (data ?? []) as { id: string }[];
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

  if (!artworkFilter && !artistFilter) {
    return Response.json({
      artworks: [],
      artists: [],
      hasMoreArtworks: false,
      hasMoreArtists: false,
    });
  }

  const artworkPromise =
    artworkLimit > 0 && artworkFilter
      ? supabase
          .from("artworks")
          .select("id,slug,title,image_url,artists(id,name,slug,image_url)")
          .or(artworkFilter)
          .order("title", { ascending: true })
          .range(artworkOffset, artworkOffset + artworkLimit)
      : Promise.resolve({ data: [], error: null });

  const artistPromise =
    artistLimit > 0 && artistFilter
      ? supabase
          .from("artists")
          .select("id,slug,name,image_url")
          .or(artistFilter)
          .order("name", { ascending: true })
          .range(artistOffset, artistOffset + artistLimit)
      : Promise.resolve({ data: [], error: null });

  const [artworksResult, artistsResult] = await Promise.all([
    artworkPromise,
    artistPromise,
  ]);

  if (artworksResult.error) {
    return new Response(artworksResult.error.message, { status: 500 });
  }
  if (artistsResult.error) {
    return new Response(artistsResult.error.message, { status: 500 });
  }

  const artworkRows = (artworksResult.data ?? []) as typeof artworksResult.data;
  const artistRows = (artistsResult.data ?? []) as typeof artistsResult.data;

  const hasMoreArtworks = artworkRows.length > artworkLimit && artworkLimit > 0;
  const hasMoreArtists = artistRows.length > artistLimit && artistLimit > 0;

  const artworks = hasMoreArtworks ? artworkRows.slice(0, artworkLimit) : artworkRows;
  const artists = hasMoreArtists ? artistRows.slice(0, artistLimit) : artistRows;

  return Response.json({
    artworks,
    artists,
    hasMoreArtworks,
    hasMoreArtists,
  });
}
