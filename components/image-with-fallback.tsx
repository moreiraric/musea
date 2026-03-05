"use client";

import { useState } from "react";

const brokenImageIconSrc = "/images/ui/other/image-broken.svg";

type ImageWithFallbackProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
};

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
      onError={() => setHasError(true)}
    />
  );
}
