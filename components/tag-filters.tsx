"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  value?: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  counts: Record<string, number>;
};

function BottomSheet({
  label,
  options,
  value,
  onChange,
  onClose,
  counts,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const selected = options.find((option) => option.slug === value);

  useEffect(() => {
    setPortalTarget(document.getElementById("app-viewport"));
  }, []);

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
        <p className="mb-[12px] text-[14px] font-medium uppercase text-[#757575] [font-family:var(--font-fira-mono)]">
          {label}
        </p>
        <div className="flex h-[calc(100%-52px)] flex-col gap-[8px] overflow-y-auto pb-[8px]">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="flex w-full items-center justify-between rounded-[12px] bg-white px-0 py-[12px] text-left text-[16px] text-black [font-family:var(--font-inter)]"
              onClick={() => {
                onChange(option.slug);
                onClose();
              }}
            >
              <span>{formatOptionLabel(option.name)}</span>
              <span className="text-[14px] text-[#757575] [font-family:var(--font-inter)]">
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
  const tabId = useTabScope();

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
    <div className="-mx-[20px] flex w-[calc(100%+40px)] gap-[10px] overflow-x-auto overflow-y-visible px-[20px] pb-[4px] hide-scrollbar">
      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent px-[12px] py-[6px]"
        onClick={() => setOpenSheet("movement")}
      >
        <span className="max-w-[140px] truncate text-[14px] font-medium text-black [font-family:var(--font-inter)]">
          {formatChipLabel(
            movementOptions.find((option) => option.slug === selectedMovement)?.name ?? "Movement",
          )}
        </span>
        <CaretIcon />
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent px-[12px] py-[6px]"
        onClick={() => setOpenSheet("medium")}
      >
        <span className="max-w-[140px] truncate text-[14px] font-medium text-black [font-family:var(--font-inter)]">
          {formatChipLabel(
            mediumOptions.find((option) => option.slug === selectedMedium)?.name ?? "Medium",
          )}
        </span>
        <CaretIcon />
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-[8px] rounded-full border border-[#d9d9d9] bg-transparent px-[12px] py-[6px]"
        onClick={() => setOpenSheet("technique")}
      >
        <span className="max-w-[140px] truncate text-[14px] font-medium text-black [font-family:var(--font-inter)]">
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
          value={selectedMovement}
          onChange={(value) => updateParam("movement", value)}
          onClose={() => setOpenSheet(null)}
          counts={movementCounts}
        />
      ) : null}
      {openSheet === "medium" ? (
        <BottomSheet
          label="Medium"
          options={mediumOptions}
          value={selectedMedium}
          onChange={(value) => updateParam("medium", value)}
          onClose={() => setOpenSheet(null)}
          counts={mediumCounts}
        />
      ) : null}
      {openSheet === "technique" ? (
        <BottomSheet
          label="Technique"
          options={techniqueOptions}
          value={selectedTechnique}
          onChange={(value) => updateParam("technique", value)}
          onClose={() => setOpenSheet(null)}
          counts={techniqueCounts}
        />
      ) : null}
    </div>
  );
}
  const formatChipLabel = (text: string) =>
    text
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" ");
