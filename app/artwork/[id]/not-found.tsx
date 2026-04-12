// Fallback screen shown when an artwork route cannot resolve to data.
// It gives the user a plain not-found message instead of an empty page.

// Renders the artwork not-found state.
export default function ArtworkNotFound() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Artwork not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t find that artwork.
      </p>
    </div>
  );
}
