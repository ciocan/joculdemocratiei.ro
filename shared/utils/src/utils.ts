import { normalizeSync } from "normalize-diacritics";
import makeSlug from "slugify";
import { init } from "@paralleldrive/cuid2";

import { csvDataLocations, csvDataFirstNames, csvDataLastNames } from "./names";

export function pluralize(n: number, singular: string, plural: string) {
  const pr = new Intl.PluralRules("ro-RO");
  switch (pr.select(n)) {
    case "one":
      return singular;
  }
  return plural;
}

export function capitalize(str = "", lowerRest = false) {
  return str.slice(0, 1).toUpperCase() + (lowerRest ? str.slice(1).toLowerCase() : str.slice(1));
}

export const removeDiacritics = (str: string) => normalizeSync(str);

export function formatNumber(value: number) {
  return Number(value).toLocaleString("ro-Ro", {
    minimumFractionDigits: 0,
  });
}

export function formatDateTime(
  date: string,
  timeZone = "Europe/Bucharest",
  fmt: "dt" | "td" = "dt",
) {
  const d = new Date(date).toLocaleDateString("ro-Ro", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  });

  const time = new Date(date).toLocaleTimeString("ro-Ro", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
  });

  return fmt === "dt" ? `${d} - ${time}` : `${time} ${d}`;
}

export function slugify(str: string) {
  return makeSlug(str, { lower: true, strict: true, locale: "ro" });
}

export const createId = init({ length: 16 });

export const getUserProfileNamingData = {
  "first-names.csv": csvDataFirstNames,
  "last-names.csv": csvDataLastNames,
  "locations.csv": csvDataLocations,
};

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
