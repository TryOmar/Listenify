import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// List of RTL language codes
const RTL_LANGUAGES = ['ar', 'fa', 'he', 'ur', 'arc', 'az', 'dv', 'ku', 'ps'];

export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.includes(languageCode.split('-')[0].toLowerCase());
}