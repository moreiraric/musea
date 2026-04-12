// Shared utility helpers used across UI components.
// This file currently exposes a class name merge helper for Tailwind-heavy markup.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines conditional class names and resolves Tailwind conflicts in one step.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
