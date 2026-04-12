"use client";

// Client-side error boundary UI for artwork detail failures.
// It exposes the message and a retry action without leaving the current route.

type ArtworkDetailErrorProps = {
  error: Error;
  reset: () => void;
};

// Renders the artwork error state and retry control.
export default function ArtworkDetailError({
  error,
  reset,
}: ArtworkDetailErrorProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Unable to load the artwork right now."}
      </p>
      <button
        className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium"
        type="button"
        onClick={reset}
      >
        Retry
      </button>
    </div>
  );
}
