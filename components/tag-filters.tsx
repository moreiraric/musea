"use client";

// Filter chip row and bottom sheets for tag pages.
// These controls keep the current filter state mirrored in the URL query string.

import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HorizontalDragScroll } from "@/components/horizontal-drag-scroll";
import { useTabScope } from "@/components/tab-state";

type FilterOption = {
  id: string;
  slug: string;
  name: string;
};

type TagFiltersProps = {
  movementOptions: FilterOption[];
  mediumOptions: FilterOption[];
  techniqueOptions: FilterOption[];
  selectedMovement?: string | null;
  selectedMedium?: string | null;
  selectedTechnique?: string | null;
  movementCounts: Record<string, number>;
  mediumCounts: Record<string, number>;
  techniqueCounts: Record<string, number>;
};

// Renders the small caret icon used on each filter chip.
function CaretIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[16px] w-[16px] text-black"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M5.5 7.5L10 12L14.5 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SheetProps = {
  label: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  onClose: () => void;
  counts: Record<string, number>;
};

// Bottom sheet used to pick a single filter value.
function BottomSheet({
  label,
  options,
  onChange,
  onClose,
  counts,
}: SheetProps) {
  const tabId = useTabScope();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const portalTarget =
    typeof document === "undefined" ? null : document.getElementById("app-viewport");
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);

  // Track downward drag distance so the sheet can be dismissed with a swipe.
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    startYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) {
      return;
    }
    const currentY = event.touches[0]?.clientY ?? startYRef.current;
    const delta = Math.max(0, currentY - startYRef.current);
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      onClose();
    }
    setDragOffset(0);
    startYRef.current = null;
  };

  if (!portalTarget) {
    return null;
  }

  // Formats option labels into the title case used throughout the UI.
  const formatOptionLabel = (text: string) =>
    text
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");

  return createPortal(
    <div data-tab={tabId} className="tab-portal absolute inset-0 z-30">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close sheet"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 rounded-t-[24px] bg-white px-[20px] pb-[24px] pt-[12px] shadow-[0_-12px_40px_rgba(0,0,0,0.2)]"
        style={{
          transform: `translateY(${dragOffset}px)`,
          height: "60%",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto mb-[12px] h-[4px] w-[48px] rounded-full bg-[#d9d9d9]" />
        <p className="text-header-ui-overline mb-[12px] text-[#757575]">
          {label}
        </p>
        <div className="flex h-[calc(100%-52px)] flex-col gap-[8px] overflow-y-auto pb-[8px]">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="text-body-default-sans flex w-full items-center justify-between rounded-[12px] bg-white px-0 py-[12px] text-left text-[#1e1e1e]"
              onClick={() => {
                onChange(option.slug);
                onClose();
              }}
            >
              <span>{formatOptionLabel(option.name)}</span>
              <span className="text-[14px] text-[#757575] [font-family:var(--font-instrument-sans)]">
                {counts[option.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

// Renders the filter chip row and coordinates which bottom sheet is open.
export function TagFilters({
  movementOptions,
  mediumOptions,
  techniqueOptions,
  selectedMovement,
  selectedMedium,
  selectedTechnique,
  movementCounts,
  mediumCounts,
  techniqueCounts,
}: TagFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openSheet, setOpenSheet] = useState<"movement" | "medium" | "technique" | null>(null);

  // Update the URL so filters stay shareable and back-button friendly.
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  };

  return (
    <HorizontalDragScroll
      className="-mx-[20px] flex w-[calc(100%+40px)] select-none gap-[8px] overflow-x-auto overflow-y-visible px-[20px] pb-[4px] hide-scrollbar cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent pl-[12px] pr-[16px] py-[8px]"
        onClick={() => setOpenSheet("movement")}
      >
        <span className="text-label-primary max-w-[140px] truncate text-black">
          {formatChipLabel(
            movementOptions.find((option) => option.slug === selectedMovement)?.name ?? "Movement",
          )}
        </span>
        <CaretIcon />
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent pl-[12px] pr-[16px] py-[8px]"
        onClick={() => setOpenSheet("medium")}
      >
        <span className="text-label-primary max-w-[140px] truncate text-black">
          {formatChipLabel(
            mediumOptions.find((option) => option.slug === selectedMedium)?.name ?? "Medium",
          )}
        </span>
        <CaretIcon />
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent pl-[12px] pr-[16px] py-[8px]"
        onClick={() => setOpenSheet("technique")}
      >
        <span className="text-label-primary max-w-[140px] truncate text-black">
          {formatChipLabel(
            techniqueOptions.find((option) => option.slug === selectedTechnique)?.name ?? "Technique",
          )}
        </span>
        <CaretIcon />
      </button>

      {openSheet === "movement" ? (
        <BottomSheet
          label="Movement"
          options={movementOptions}
          onChange={(value) => updateParam("movement", value)}
          onClose={() => setOpenSheet(null)}
          counts={movementCounts}
        />
      ) : null}
      {openSheet === "medium" ? (
        <BottomSheet
          label="Medium"
          options={mediumOptions}
          onChange={(value) => updateParam("medium", value)}
          onClose={() => setOpenSheet(null)}
          counts={mediumCounts}
        />
      ) : null}
      {openSheet === "technique" ? (
        <BottomSheet
          label="Technique"
          options={techniqueOptions}
          onChange={(value) => updateParam("technique", value)}
          onClose={() => setOpenSheet(null)}
          counts={techniqueCounts}
        />
      ) : null}
    </HorizontalDragScroll>
  );
}

// Formats the chip label text shown in the collapsed filter row.
const formatChipLabel = (text: string) =>
    text
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");
