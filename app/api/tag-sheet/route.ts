import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const artworks = (artworksResult.data ?? [])
    .map((row) => (row as { artworks: unknown }).artworks)
    .filter(Boolean);

  return NextResponse.json({
    tag,
    bannerArtwork: bannerResult.data ?? null,
    artworks,
  });
}
