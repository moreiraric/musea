"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import { ArtistPortraitAndName } from "@/components/artist-portrait";
import { ArtworkCardSmall } from "@/components/artwork-card-small";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { buildSearchTokens, scoreRelevance } from "@/lib/search-utils";

type SearchArtist = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
};

type SearchArtwork = {
  id: string;
  slug: string | null;
  title: string;
  image_url: string | null;
  artists?: SearchArtist | null;
};

type SearchResultsProps = {
  query: string;
  initialArtworks: SearchArtwork[];
  initialArtists: SearchArtist[];
  initialHasMoreArtworks: boolean;
  initialHasMoreArtists: boolean;
  artworkPageSize: number;
  artistPageSize: number;
};

type SearchResponse = {
  artworks: SearchArtwork[];
  artists: SearchArtist[];
  hasMoreArtworks: boolean;
  hasMoreArtists: boolean;
};

function getThumbnailUrl(url?: string | null, size = 360) {
  if (!url) {
    return null;
  }
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
      return url;
    }
  } catch {
    // ignore invalid URLs
  }
  return url;
}

function getArtistKey(artist: SearchArtist) {
  return artist.id || artist.slug || artist.name;
}

function mergeUniqueByKey<T>(
  previous: T[],
  next: T[],
  getKey: (item: T) => string,
) {
  const map = new Map(previous.map((item) => [getKey(item), item]));
  next.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

export function SearchResults({
  query,
  initialArtworks,
  initialArtists,
  initialHasMoreArtworks,
  initialHasMoreArtists,
  artworkPageSize,
  artistPageSize,
}: SearchResultsProps) {
  const [artworks, setArtworks] = useState<SearchArtwork[]>(initialArtworks);
  const [artists, setArtists] = useState<SearchArtist[]>(initialArtists);
  const [hasMoreArtworks, setHasMoreArtworks] = useState(initialHasMoreArtworks);
  const [hasMoreArtists, setHasMoreArtists] = useState(initialHasMoreArtists);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const tokens = useMemo(() => buildSearchTokens(query), [query]);

  const fetchResults = useCallback(
    async (
      artworkOffset: number,
      artistOffset: number,
      artworkLimit: number,
      artistLimit: number,
    ) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("artworkOffset", String(artworkOffset));
      params.set("artistOffset", String(artistOffset));
      params.set("artworkLimit", String(artworkLimit));
      params.set("artistLimit", String(artistLimit));
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as SearchResponse;
      return data;
    },
    [query],
  );

  useEffect(() => {
    let isActive = true;
    const refresh = async () => {
      if (!query) {
        return;
      }
      setIsRefreshing(true);
      const data = await fetchResults(0, 0, artworkPageSize, artistPageSize);
      if (!isActive) {
        return;
      }
      if (data) {
        setArtworks(data.artworks ?? []);
        setArtists(data.artists ?? []);
        setHasMoreArtworks(Boolean(data.hasMoreArtworks));
        setHasMoreArtists(Boolean(data.hasMoreArtists));
      }
      setIsRefreshing(false);
    };
    refresh();
    return () => {
      isActive = false;
    };
  }, [query, fetchResults, artworkPageSize, artistPageSize]);

  const derivedArtists = useMemo(() => {
    const map = new Map<string, SearchArtist>();
    artworks.forEach((artwork) => {
      const artist = artwork.artists;
      if (!artist) {
        return;
      }
      map.set(getArtistKey(artist), artist);
    });
    return Array.from(map.values());
  }, [artworks]);

  const combinedArtists = useMemo(() => {
    return mergeUniqueByKey(artists, derivedArtists, getArtistKey);
  }, [artists, derivedArtists]);

  const sortedArtists = useMemo(() => {
    return [...combinedArtists].sort((a, b) => {
      const scoreA = scoreRelevance(a.name, query, tokens);
      const scoreB = scoreRelevance(b.name, query, tokens);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [combinedArtists, query, tokens]);

  const sortedArtworks = useMemo(() => {
    return [...artworks].sort((a, b) => {
      const artistNameA = a.artists?.name ?? "";
      const artistNameB = b.artists?.name ?? "";
      const scoreA = Math.max(
        scoreRelevance(a.title, query, tokens),
        scoreRelevance(artistNameA, query, tokens),
      );
      const scoreB = Math.max(
        scoreRelevance(b.title, query, tokens),
        scoreRelevance(artistNameB, query, tokens),
      );
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return a.title.localeCompare(b.title);
    });
  }, [artworks, query, tokens]);

  const loadMoreArtworks = useCallback(async () => {
    if (isLoadingArtworks || !hasMoreArtworks) {
      return;
    }
    setIsLoadingArtworks(true);
    const data = await fetchResults(
      artworks.length,
      artists.length,
      artworkPageSize,
      0,
    );
    if (data) {
      setArtworks((prev) => mergeUniqueByKey(prev, data.artworks, (item) => item.id));
      if (typeof data.hasMoreArtworks === "boolean") {
        setHasMoreArtworks(data.hasMoreArtworks);
      }
    }
    setIsLoadingArtworks(false);
  }, [
    artworks.length,
    artists.length,
    artworkPageSize,
    fetchResults,
    hasMoreArtworks,
    isLoadingArtworks,
  ]);

  const loadMoreArtists = useCallback(async () => {
    if (isLoadingArtists || !hasMoreArtists) {
      return;
    }
    setIsLoadingArtists(true);
    const data = await fetchResults(
      artworks.length,
      artists.length,
      0,
      artistPageSize,
    );
    if (data) {
      setArtists((prev) => mergeUniqueByKey(prev, data.artists, getArtistKey));
      if (typeof data.hasMoreArtists === "boolean") {
        setHasMoreArtists(data.hasMoreArtists);
      }
    }
    setIsLoadingArtists(false);
  }, [
    artworks.length,
    artists.length,
    artistPageSize,
    fetchResults,
    hasMoreArtists,
    isLoadingArtists,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMoreArtworks();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [loadMoreArtworks]);

  const handleArtistScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasMoreArtists || isLoadingArtists) {
        return;
      }
      const container = event.currentTarget;
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 80) {
        loadMoreArtists();
      }
    },
    [hasMoreArtists, isLoadingArtists, loadMoreArtists],
  );

  if (!isRefreshing && sortedArtists.length === 0 && sortedArtworks.length === 0) {
    return (
      <div className="flex w-full flex-col items-center px-[20px] pt-[180px] text-center">
        <img
          alt=""
          aria-hidden="true"
          className="h-[200px] w-[200px] object-contain opacity-50"
          src="/images/illustrations/no-results.svg"
          loading="lazy"
          decoding="async"
        />
        <p className="text-label-primary mt-[8px] w-full max-w-[353px] text-center text-[#757575]">
          We couldn’t find any artists or artworks with that name. Try another search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[32px] pb-[32px] pt-[16px]">
      {sortedArtists.length > 0 ? (
        <section className="flex w-full flex-col gap-[12px] px-[20px]">
          <p className="text-label-primary text-[#757575]">
            Artists
          </p>
          <HorizontalDragScroll
            className="-mx-[20px] flex w-[calc(100%+40px)] items-start gap-[8px] overflow-x-auto overflow-y-visible px-[20px] pb-[4px] hide-scrollbar"
            onScroll={handleArtistScroll}
          >
            {sortedArtists.map((artist) => (
              <ArtistPortraitAndName
                key={getArtistKey(artist)}
                name={artist.name}
                imageUrl={getThumbnailUrl(artist.image_url, 240) ?? artist.image_url}
                href={`/artist/${artist.slug ?? artist.id}`}
              />
            ))}
          </HorizontalDragScroll>
        </section>
      ) : null}

      {sortedArtworks.length > 0 ? (
        <section className="flex w-full flex-col gap-[16px] px-[20px]">
          <p className="text-label-primary text-[#757575]">
            Artworks
          </p>
          <div className="grid w-full grid-cols-2 justify-items-start gap-x-[20px] gap-y-[24px]">
            {sortedArtworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/artwork/${artwork.slug ?? artwork.id}`}
                className="flex w-[168.5px] flex-col items-start"
              >
                <ArtworkCardSmall
                  title={artwork.title}
                  artistName={artwork.artists?.name ?? null}
                  imageUrl={getThumbnailUrl(artwork.image_url, 360)}
                  imageAlt={artwork.title}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div ref={loadMoreRef} className="h-[1px] w-full" />
    </div>
  );
}
