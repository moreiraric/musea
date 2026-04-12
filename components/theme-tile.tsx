// Tile component for theme and tag navigation grids.
// It maps known theme names to a matching illustration so the grid stays recognizable.

import Link from "next/link";

// === TYPES AND ICON MAPPING ===

type ThemeTileProps = {
  href: string;
  name: string;
  slug?: string | null;
};

const themeIconMap: Record<string, string> = {
  abstraction: "/images/ui/theme_icons/Property%201=ScribbleLoop.png",
  allegory: "/images/ui/theme_icons/Property%201=PuzzlePiece.png",
  animals: "/images/ui/theme_icons/Property%201=Dog.png",
  cityscapes: "/images/ui/theme_icons/Property%201=City.png",
  colour: "/images/ui/theme_icons/Property%201=Swatches.png",
  consumerism: "/images/ui/theme_icons/Property%201=ShoppingCart.png",
  death: "/images/ui/theme_icons/Property%201=Skull.png",
  figures: "/images/ui/theme_icons/Property%201=PersonSimple.png",
  genre: "/images/ui/theme_icons/Property%201=SquaresFour.png",
  history: "/images/ui/theme_icons/Property%201=Scroll.png",
  interiors: "/images/ui/theme_icons/Property%201=Armchair.png",
  isolation: "/images/ui/theme_icons/Property%201=CircleDashed.png",
  landscape: "/images/ui/theme_icons/Property%201=Mountains.png",
  love: "/images/ui/theme_icons/Property%201=Heart.png",
  manmade: "/images/ui/theme_icons/Property%201=Windmill.png",
  movement: "/images/ui/theme_icons/Property%201=SneakerMove.png",
  mythology: "/images/ui/theme_icons/Property%201=FinnTheHuman.png",
  nature: "/images/ui/theme_icons/Property%201=TreeEvergreen.png",
  portraiture: "/images/ui/theme_icons/Property%201=UserSquare.png",
  religion: "/images/ui/theme_icons/Property%201=Church.png",
  seascapes: "/images/ui/theme_icons/Property%201=Island.png",
  "self-portrait": "/images/ui/theme_icons/Property%201=UserFocus.png",
  "self-portraiture": "/images/ui/theme_icons/Property%201=UserFocus.png",
  "shape-and-form": "/images/ui/theme_icons/Property%201=SquareSplitVertical.png",
  "still-life": "/images/ui/theme_icons/Property%201=Orange.png",
  "the-unconscious": "/images/ui/theme_icons/Property%201=Moon.png",
  war: "/images/ui/theme_icons/Property%201=Sword.png",
};

const defaultThemeIcon = "/images/ui/theme_icons/Property%201=ScribbleLoop.png";

// Normalizes labels so slug and name lookups share the same key shape.
function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

// Converts stored theme labels into a clean title-case display label.
function formatThemeLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Resolves the most specific icon match and falls back to the default asset.
function resolveThemeIcon(slug?: string | null, name?: string | null) {
  const slugKey = normalizeKey(slug ?? "");
  const nameKey = normalizeKey(name ?? "");
  return themeIconMap[slugKey] ?? themeIconMap[nameKey] ?? defaultThemeIcon;
}

// Renders a clickable theme tile for browse surfaces.
export function ThemeTile({ href, name, slug }: ThemeTileProps) {
  return (
    <Link
      href={href}
      className="flex h-[100px] w-full items-start rounded-[24px] border border-[#d9d9d9] p-[16px]"
    >
      <div className="flex h-full w-full flex-col items-end justify-between">
        <img
          alt=""
          aria-hidden="true"
          className="h-[32px] w-[32px] object-contain"
          src={resolveThemeIcon(slug, name)}
        />
        <p className="w-full text-[16px] font-normal leading-[20px] text-[#1e1e1e] [font-family:var(--font-instrument-sans)]">
          {formatThemeLabel(name)}
        </p>
      </div>
    </Link>
  );
}
