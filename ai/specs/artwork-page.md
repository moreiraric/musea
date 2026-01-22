

# Artwork Page Spec (v0)

## 1. Purpose

The Artwork page is the primary learning moment in the app. It presents one artwork with enough context to make it engaging and understandable, and it provides clear pathways to explore related content (artist, movement, tags).

## 2. Route

* `/artwork/:id`

## 3. Data Requirements (Supabase)

### Tables

* `artworks`
* `artists`
* `movements` (optional)
* `artwork_slides`
* `tags` via `artwork_tags`

### Required fetch (minimum)

Given `artwork_id`:

1) Artwork core
   * `artworks` row by `id`
   * join `artists` via `artworks.artist_id`
   * join `movements` via `artworks.movement_id` (nullable)

2) Guided look content
   * `artwork_slides` row by `artwork_id` (nullable for v0 if not generated yet)

3) Tags
   * `artwork_tags` rows by `artwork_id`
   * join `tags` by `tag_id`

### Sorting rules

* Tags: group by `tags.category`, then sort within group by `tags.name` asc.

## 4. UI Sections (vertical scroll)

1) **Header**
   * Back
   * Save/Favorite toggle (Phase 1 if `saves` table isn’t implemented, see Feature Flags)

2) **Artwork Image Stage**
   * High-quality image
   * No overlapping UI on the image itself

3) **Artwork Meta**
   * Title
   * Artist name (tap → Artist page)
   * Year (from `artworks.year` if present)

4) **Guided Look (Slides)**
   * Horizontal carousel with snap paging
   * Slide indicator required (dots or `1/5`)
   * Content source: `artwork_slides.slides` (jsonb)

5) **Reflection Prompt**
   * Display `artwork_slides.reflection_question` if present
   * v0: read-only prompt (no reactions) unless reactions are implemented

6) **Tags**
   * Chip groups by category (theme/technique/emotion/etc, based on your `tag_category` enum)
   * Tap → Tag page

7) **Movement Card** (optional)
   * Only if `artworks.movement_id` exists
   * Shows movement name + `movements.summary` (if present)
   * Tap → Movement page

8) **Artist Preview (optional)**
   * Minimal artist card (name, portrait if available)
   * Tap → Artist page

## 5. Interactions

* Tap artist → `/artist/:id`
* Tap movement → `/movement/:id`
* Tap tag → `/tag/:id`
* Swipe slides horizontally
* Scroll page vertically

## 6. States and Edge Cases

### Loading

* Show skeletons for image, meta, and slide area.

### Missing data

* No `movement_id` → hide Movement section.
* No `artwork_slides` row → hide slides + reflection prompt, or show a placeholder (“Story coming soon”).
* No tags → hide tags section.
* Missing `image_url` → show fallback image container and error text.

### Error

* Failed fetch → show simple error state with retry.

## 7. Feature Flags (v0)

Because v0 DB currently does not include certain tables:

* **Save/Favorite**
  * If `saves` table not implemented: show disabled state or hide.

* **Reactions**
  * Out of scope for v0 per backbone doc: do not render reaction composer or community feed.
  * Only show `reflection_question` as read-only.

* **AI Ask**
  * If not implemented: render UI-only stub (button + modal shell) with placeholder response.

## 8. Content Contract (slides json)

Define and adhere to a single JSON shape so the frontend does not guess.

Recommended shape:

```json
[
  { "key": "scene", "title": "Scene", "body": "..." },
  { "key": "figures", "title": "Figures", "body": "..." },
  { "key": "symbolism", "title": "Symbolism", "body": "..." },
  { "key": "craft", "title": "Craft in Context", "body": "..." },
  { "key": "impact", "title": "Impact", "body": "..." }
]
```

## 9. Analytics (optional, later)

Not required for v0. Add only if you’re already wiring analytics.

* `view_artwork`
* `slide_change`
* `tap_tag`
* `tap_artist`
* `tap_movement`

---

End of artwork page spec