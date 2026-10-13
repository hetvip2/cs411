import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanParkName(name: string | undefined | null): string {
  if (!name) return "";
  return name.replace(/\*$/g, "").trim();
}