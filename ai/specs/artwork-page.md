

# Artwork Page Spec (v0), one-shot build doc for Codex

This spec is written to let Codex implement the Artwork page end-to-end with minimal back-and-forth.

---

## 0) What you are building

A **generic** Artwork Detail page at route:

- **Next.js App Router route:** `/artwork/[id]`
- `id` is the **UUID** of a row in `public.artworks`.

The UI is data-driven and must work for **any** artwork id.

**v0 constraints**
- Read-only (no reactions feed, no save writes).
- You may render a disabled Save icon or hide it.
- AI Ask may be a UI-only stub.

---

## 1) Source of truth

- DB schema source of truth: `ai/project.md` (Supabase `public` schema).
- Visual structure source of truth: Figma layer tree (below).
- Do not invent tables/columns.

---

## 2) Figma mapping (layer names → UI sections)

Frame: **Artwork Detail** id=1034:194

Top level under `Content` id=1034:195:

1) `ArtworkFrame` id=1034:198
   - `{artwork.image_url}` id=1034:424

2) `ArtworkInfo` id=1034:200
   - `Header` id=1034:201
   - `ArtworkTitle` id=1034:202 → `{artwork.title}` text id=1034:203
   - `ArtistInfo` id=1034:204
     - `ArtistChip` id=1034:205
       - `{artists.image}` id=1034:429
       - `{artists.name}` text id=1034:208
     - `{artworks.year}` text id=1034:210
   - `SlidesCarousel` id=1034:211
     - `Slides` id=1034:212
       - slide01..slide05 frames

3) `Tags` section id=1116:203
   - Header text id=1116:204
   - Tags frame id=1116:205

4) `AIConversation` id=1034:225
   - `{artwork_slides.reflection_question}` text id=1034:227

5) `MoreArtworkInfo` id=1034:228
   - `Movement` id=1034:272 → `MovementCard` id=1189:8
   - `Craft` id=1240:76 → CraftCards + Technique/Medium/Representation cards

**Important layout note**
- You already have a global AppShell/TopNav. The internal Figma `Header` (id=1034:201) should be treated as **spacing only** (or omitted) to avoid double headers.

---

## 3) Data contract (Supabase) and where it goes

### Tables used

- `artworks`
- `artists`
- `movements` (optional)
- `artwork_slides` (optional but preferred)
- `artwork_tags` join → `tags`

### Field → UI mapping

Artwork
- `artworks.title` → ArtworkTitle
- `artworks.image_url` → Artwork image
- `artworks.year` (nullable) → year text (hide if null)
- `artworks.artist_id` → join artists
- `artworks.movement_id` (nullable) → join movements (controls Movement section visibility)

Artist
- `artists.name` → ArtistChip label (links to `/artist/[id]`)
- `artists.image_url` (nullable) → ArtistChip avatar (optional)

Slides
- `artwork_slides.slides` (jsonb) → SlidesCarousel
- `artwork_slides.reflection_question` (text) → AIConversation prompt (read-only)

Tags
- `tags.category` → group label
- `tags.name` → chip label
- `tags.id` → chip link `/tag/[id]`

Movement (optional)
- `movements.name` → MovementCard title
- `movements.summary` (nullable) → MovementCard description

Craft (v0)
- v0 may be static placeholders, do not invent tables.

---

## 4) Exact query plan (no guessing)

Implement a single data fetch that returns this normalized object:

```ts
type Slide = { key?: string; title: string; body: string }

type ArtworkPageData = {
  artwork: {
    id: string
    title: string
    year: number | null
    image_url: string | null
    artist_id: string
    movement_id: string | null
  }
  artist: {
    id: string
    name: string
    image_url: string | null
  }
  movement: {
    id: string
    name: string
    summary: string | null
  } | null
  slides: Slide[] | null
  reflectionQuestion: string | null
  tagsByCategory: Record<string, { id: string; name: string; category: string }[]>
}
```

### Preferred Supabase query approach

Run these queries (joins allowed where supported by your existing Supabase helper patterns):

1) Artwork + Artist + Movement in one query
- Select from `public.artworks` by `id`
- Join `artists` via `artist_id`
- Join `movements` via `movement_id` (nullable)

Minimum fields:
- artworks: `id,title,year,image_url,artist_id,movement_id`
- artists: `id,name,image_url`
- movements: `id,name,summary`

2) Slides
- Select from `public.artwork_slides` where `artwork_id = artwork.id`
- Fields: `slides, reflection_question`

3) Tags
- Select from `public.artwork_tags` where `artwork_id = artwork.id`
- Join `public.tags` on `tag_id`
- Fields from tags: `id,name,category`

### Sorting/grouping rules

- Group tags by `category`.
- Within each category, sort tags by `name` ascending.

---

## 5) UI structure (vertical order)

Inside AppShell main scroll area, render in this order:

1) ArtworkFrame
2) ArtworkTitle + ArtistChip + Year
3) SlidesCarousel
4) Tags
5) AIConversation (reflection question)
6) MovementCard (optional)
7) Craft (optional, may be static)

---

## 6) Slide JSON parsing rules (must be safe)

`artwork_slides.slides` is jsonb. Parse defensively.

Expected shape:

```json
[
  { "key": "scene", "title": "Scene", "body": "..." },
  { "key": "figures", "title": "Figures", "body": "..." },
  { "key": "symbolism", "title": "Symbolism", "body": "..." },
  { "key": "craft", "title": "Craft in Context", "body": "..." },
  { "key": "impact", "title": "Impact", "body": "..." }
]
```

Rules:
- If slides missing, not an array, or items missing title/body, treat as `slides = null`.
- Carousel renders up to 5 slides.
- Must include a slide indicator (dots or `1/5`).

Placeholder:
- If `slides = null`, show a small placeholder block: “Story coming soon”.

---

## 7) Required states

- Loading: skeletons for image, meta, slides.
- Error: simple error state with retry.
- Missing image_url: show neutral container and “Image unavailable”.
- Missing movement: hide movement section.
- Missing reflectionQuestion: hide AIConversation section.
- Missing tags: hide tags section.

---

## 8) Implementation details (what files to create/modify)

Codex should:

1) Create the route page
- `app/artwork/[id]/page.tsx` (server component)

2) Create minimal UI components (only if not already present)
- `components/artwork/ArtworkImageStage.tsx`
- `components/artwork/ArtworkMeta.tsx`
- `components/artwork/SlidesCarousel.tsx` (client component if needed for snapping/indicator)
- `components/tags/TagChipGroup.tsx`
- `components/movements/MovementCard.tsx`

3) Create data fetch helpers (reuse existing patterns if present)
- `lib/supabase/server.ts` (or existing) to create a server Supabase client
- `lib/data/getArtworkPageData.ts` that returns `ArtworkPageData`

**Do not** implement `reactions` or `saves` writes.

---

## 9) Acceptance checklist

- `/artwork/[id]` renders any artwork by UUID.
- Mona Lisa id renders without crashes: `27c9797b-c924-44d8-b283-3622525d039e`.
- Tags are grouped by category and sorted.
- Movement card only shows when movement exists.
- Slides carousel works, indicator present, safe parsing, placeholder when missing.
- Only the main content scrolls (AppShell behavior).

---

End of spec