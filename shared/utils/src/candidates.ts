import { shuffleArray } from "./utils";
import { type ThemeColor, defaultTheme, getAvatarPath } from "./theme-config";

export interface Ideology {
  e: number; // Economy: Left-Right
  s: number; // Social / Cultural: Progressive–Conservative
  g: number; // Government: Libertarian–Authoritarian
}

export type CandidateSlug =
  | "simion"
  | "antonescu"
  | "lasconi"
  | "terhes"
  | "sandru"
  | "ponta"
  | "popescu"
  | "predoiu"
  | "banu"
  | "funeriu"
  | "dan";

export interface Candidate {
  id: string;
  slug: CandidateSlug;
  name: string;
  tagline: string;
  party: string;
  image: string;
  ideology: Ideology;
  isAvailable: boolean;
}

export const candidates: Candidate[] = [
  {
    id: "1",
    slug: "simion",
    name: "George Simion",
    tagline: "Democrație",
    party: "AUR",
    image: "/img/avatars/simion.jpg",
    ideology: { e: 60, s: 90, g: 80 },
    isAvailable: true,
  },
  {
    id: "2",
    slug: "antonescu",
    name: "Crin Antonescu",
    tagline: "România, înainte!",
    party: "Ind. (coalitie)",
    image: "/img/avatars/antonescu.jpg",
    ideology: { e: 55, s: 80, g: 50 },
    isAvailable: true,
  },
  {
    id: "3",
    slug: "lasconi",
    name: "Elena Lasconi",
    tagline: "Am curaj să fac dreptate!",
    party: "USR",
    image: "/img/avatars/lasconi.jpg",
    ideology: { e: 65, s: 60, g: 40 },
    isAvailable: true,
  },
  {
    id: "4",
    slug: "terhes",
    name: "Cristian Terheș",
    tagline: "Credincios națiunii române",
    party: "PNCR",
    image: "/img/avatars/terhes.jpg",
    ideology: { e: 60, s: 95, g: 85 },
    isAvailable: false,
  },
  {
    id: "5",
    slug: "sandru",
    name: "Lavinia Șandru",
    tagline: "România Reală",
    party: "PUSL",
    image: "/img/avatars/sandru.jpg",
    ideology: { e: 40, s: 60, g: 50 },
    isAvailable: false,
  },
  {
    id: "6",
    slug: "ponta",
    name: "Victor Ponta",
    tagline: "România pe primul loc!",
    party: "Ind.",
    image: "/img/avatars/ponta.jpg",
    ideology: { e: 30, s: 70, g: 60 },
    isAvailable: true,
  },
  {
    id: "7",
    slug: "popescu",
    name: "Sebastian Popescu",
    tagline: "...",
    party: "PNR",
    image: "/img/avatars/popescu.jpg",
    ideology: { e: 50, s: 50, g: 50 },
    isAvailable: false,
  },
  {
    id: "8",
    slug: "predoiu",
    name: "Silviu Predoiu",
    tagline: "Competență. Caracter. Curaj.",
    party: "PLAN",
    image: "/img/avatars/predoiu.jpg",
    ideology: { e: 45, s: 55, g: 60 },
    isAvailable: false,
  },
  {
    id: "9",
    slug: "banu",
    name: "John Ion Banu",
    tagline: "Democrația și Civilizația trebuiesc apărate de către cetățeni",
    party: "Ind.",
    image: "/img/avatars/banu.jpg",
    ideology: { e: 55, s: 75, g: 65 },
    isAvailable: false,
  },
  {
    id: "10",
    slug: "funeriu",
    name: "Daniel Funeriu",
    tagline: "Asta-i direcția!",
    party: "Ind.",
    image: "/img/avatars/funeriu.jpg",
    ideology: { e: 70, s: 60, g: 50 },
    isAvailable: true,
  },
  {
    id: "11",
    slug: "dan",
    name: "Nicușor Dan",
    tagline: "România Onestă",
    party: "Ind. (coalitie)",
    image: "/img/avatars/dan.jpg",
    ideology: { e: 60, s: 50, g: 30 },
    isAvailable: true,
  },
];

// Function to get candidate avatar URL based on theme
export function getCandidateAvatarUrl(
  candidateId: string,
  theme: ThemeColor = defaultTheme,
): string {
  const basePath = getAvatarPath(theme);
  const fileName = {
    "1": "simion.jpg",
    "2": "antonescu.jpg",
    "3": "lasconi.jpg",
    "4": "terhes.jpg",
    "5": "sandru.jpg",
    "6": "ponta.jpg",
    "7": "popescu.jpg",
    "8": "predoiu.jpg",
    "9": "banu.jpg",
    "10": "funeriu.jpg",
    "11": "dan.jpg",
  }[candidateId];

  return `${basePath}/${fileName}`;
}

// Legacy support for direct access (uses default theme)
export const candidateAvatarUrl = {
  "1": getCandidateAvatarUrl("1"),
  "2": getCandidateAvatarUrl("2"),
  "3": getCandidateAvatarUrl("3"),
  "4": getCandidateAvatarUrl("4"),
  "5": getCandidateAvatarUrl("5"),
  "6": getCandidateAvatarUrl("6"),
  "7": getCandidateAvatarUrl("7"),
  "8": getCandidateAvatarUrl("8"),
  "9": getCandidateAvatarUrl("9"),
  "10": getCandidateAvatarUrl("10"),
  "11": getCandidateAvatarUrl("11"),
} as const;

export const candidateIdToSlugMap = candidates.reduce(
  (acc, candidate) => {
    acc[candidate.id] = candidate.slug;
    return acc;
  },
  {} as Record<string, CandidateSlug>,
);

export const shuffledCandidates = shuffleArray(candidates);

export interface CandidateResponse {
  id: string;
  isRisky: boolean;
  source: string;
  date: string;
  quote: string;
}

export type CandidateResponses = Record<CandidateSlug, CandidateResponse[]>;
