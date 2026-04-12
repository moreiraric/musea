"use client";

// Shared image wrapper that swaps in a broken-image icon when loading fails.
// This keeps artwork cards and detail views visually stable when museum URLs break.

import { useState } from "react";

// === CONSTANTS AND TYPES ===

const brokenImageIconSrc = "/images/ui/other/image-broken.svg";

type ImageWithFallbackProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
};

// Renders a normal image until the source is missing or errors out.
export function ImageWithFallback({
  src,
  alt = "",
  className,
  fallbackClassName = "h-[32px] w-[32px] object-contain opacity-70",
  loading,
  decoding,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={fallbackClassName}
        src={brokenImageIconSrc}
      />
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      src={src}
      loading={loading}
      decoding={decoding}
      // Switch to the fallback icon after the first load failure.
      onError={() => setHasError(true)}
    />
  );
}
