# Codex Spec, Art App (Backbone)

## 0. Product Summary

Mobile-first art history + appreciation app. Users explore public-domain artworks through non-linear navigation (tags, movement, artist) and read a short guided “slideshow” that teaches how to look.

## 1. MVP Scope

### In scope

* Artwork detail page (primary)
* Browse/discovery entry point (simple)
* Tag exploration pages (theme/technique/emotion as “portals”)
* Movement page (overview + example artworks)
* Artist page (basic profile + artworks)
* Save/favorite artworks to personal gallery
* Basic AI “Ask about this artwork” (UI-only stub is acceptable for v0)

### Out of scope (Phase 2+)

* Reactions (quick reactions + short text reactions)
* Threads/replies on reactions
* AI synthesis of community reactions
* Quizzes, badges, progression system
* Full CMS authoring UI
* Advanced search, recommendations, personalization beyond “saved”

## 2. Core Objects (Supabase Data Model)

This section reflects the current **Supabase `public` schema** (non-backup tables).

### artists

* id (uuid, PK, default `gen_random_uuid()`)
* created_at (timestamptz, required, default `now()`)
* name (text, required)
* slug (text, required)
* wikidata_id (text, optional)
* bio (text, optional)
* quote (text, optional)
* primary_movement_id (uuid, optional, FK → movements.id)
* image_url (text, optional)
* life_period (text, optional)
* country (text, optional)

### artworks

* id (uuid, PK, default `gen_random_uuid()`)
* title (text, required)
* slug (text, required)
* artist_id (uuid, required, FK → artists.id)
* year (int, optional)
* image_url (text, optional)
* museum_source (text, optional)
* source_id (text, optional)
* public_domain (bool, optional, default `true`)
* created_at (timestamptz, optional, default `now()`)
* movement_id (uuid, optional, FK → movements.id)
* wikidata_id (text, optional)
* museum_name (text, optional)
* museum_wikidata_id (text, optional)

### movements

* id (uuid, PK, default `gen_random_uuid()`)
* created_at (timestamptz, required, default `now()`)
* name (text, required)
* slug (text, required)
* start_year (int, optional)
* end_year (int, optional)
* summary (text, optional)
* icon_url (text, optional)

### tags

* id (uuid, PK, default `gen_random_uuid()`)
* name (text, required)
* slug (text, required)
* category (tag_category enum, required)
* created_at (timestamptz, required, default `now()`)
* short_description (text, optional)
* description (text, optional)

### artwork_tags (join)

* artwork_id (uuid, required, PK part, FK → artworks.id)
* tag_id (uuid, required, PK part, FK → tags.id)
* created_at (timestamptz, required, default `now()`)

### artwork_slides

* id (uuid, PK, default `gen_random_uuid()`)
* artwork_id (uuid, required, FK → artworks.id)
* slides (jsonb, required)
* reflection_question (text, required)
* model (text, optional)
* prompt_version (text, optional)
* generation_status (text, optional, default `'success'`)
* generated_at (timestamptz, optional, default `now()`)
* error (text, optional)

### Planned tables (not yet in Supabase)

These exist in product scope, but are **not implemented in the DB yet**:

* saves
* reactions
* users

## 3. Routes (MVP)

* / (Home)
* /artwork/:id
* /artist/:id
* /movement/:id
* /tag/:id
* /saved

## 4. Technical Assumptions

* Frontend: React/Next.js (mobile-first responsive)
* Target viewport: mobile app shown in a browser, designed for iPhone Pro frame (402×874 px)
* Backend: Supabase (Postgres) with tables above
* Images: served via URLs from public museum sources or stored in DB
* Auth: optional for v0, acceptable to mock a user or keep the app read-only

## 5. Non-Goals (Backbone)

* No timeline curriculum requirement
* No trivia-first experience
* No assumption of social/community features in v0

---

End of backbone spec