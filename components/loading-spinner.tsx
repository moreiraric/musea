// Small loading indicator used across pages and async UI states.
// The size prop lets each screen scale the spinner without duplicating markup.

// Renders a simple spinning circle for pending states.
export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-[3px] border-black/15 border-t-black"
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  );
}
