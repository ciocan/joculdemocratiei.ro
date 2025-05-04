import { candidates } from "./candidates";
import type { BotPlayer } from "./types/bot";
import type { Vote } from "./types/game";
import { candidateIdToSlugMap } from "./candidates";

// List of Romanian first names for bots
const BOT_FIRST_NAMES = [
  "Roboțel",
  "Botuleț",
  "Cyborgu",
  "Droidel",
  "Mecha Mihai",
  "Techno Tudor",
  "Gadget Gabi",
  "Bit Bogdan",
  "Pixel Petru",
  "Circuit Cristi",
  "Robo Raluca",
  "Bionic Bianca",
  "Data Dana",
  "Nano Nicoleta",
  "Automaton Ana",
  "Gear Giorgiana",
  "Volt Violeta",
  "Silicon Sofia",
];

const BOT_LAST_NAMES = [
  "Ciberneticu",
  "Algoritmovici",
  "Procesorescu",
  "Digitalianu",
  "Microciparu",
  "Interfățeanu",
  "Codrescu",
  "Binărescu",
  "Sistemianu",
  "Cloudescu",
  "Firewallovici",
  "Serverianu",
  "Pixelovici",
  "Rezistențiu",
  "Voltajescu",
  "Circuitianu",
  "Transistoru",
  "Megabyțeanu",
  "Terabyțescu",
];

const COUNTIES = [
  { name: "Neo-Dacia", code: "ND" },
  { name: "Cyber-Moldova", code: "CM" },
  { name: "Transil-Virtus", code: "TV" },
  { name: "Wallachia-Nova", code: "WN" },
  { name: "Banat-Electron", code: "BE" },
];

const CITIES: Record<string, string[]> = {
  ND: ["Dacia Luminaris", "Sarmizegetusa 2.0", "Burebista Byte", "Decebal Digital"],
  CM: ["Iași Interlink", "Chișinău Circuit", "Ștefan MegaCore", "Neamț Nexus"],
  TV: ["Brașov Bitforge", "Sibiu Synth", "Cluj Cloudspire", "Timișoara Terabyte"],
  WN: ["București Neon", "Craiova Cyberdome", "Ploiești Plasma", "Târgoviște Techtron"],
  BE: ["Arad Algorithm", "Oradea Overclock", "Reșița Robotics", "Lugoj Lasergrid"],
};

export function generateBotId(): string {
  return `bot-${Math.random().toString(36).substring(2, 10)}`;
}

export function generateBotName(): { firstName: string; lastName: string } {
  const firstName = BOT_FIRST_NAMES[Math.floor(Math.random() * BOT_FIRST_NAMES.length)];
  const lastName = BOT_LAST_NAMES[Math.floor(Math.random() * BOT_LAST_NAMES.length)];
  return { firstName, lastName };
}

export function generateBotLocation(): { county: string; countyCode: string; city: string } {
  const county = COUNTIES[Math.floor(Math.random() * COUNTIES.length)];
  const cities = CITIES[county.code] || ["Unknown"];
  const city = cities[Math.floor(Math.random() * cities.length)];

  return {
    county: county.name,
    countyCode: county.code,
    city,
  };
}

export function createBotPlayer(): BotPlayer {
  const { firstName, lastName } = generateBotName();
  const { county, countyCode, city } = generateBotLocation();
  const availableCandidates = candidates.filter((c) => c.isAvailable);
  const randomCandidate =
    availableCandidates[Math.floor(Math.random() * availableCandidates.length)];

  return {
    playerId: generateBotId(),
    name: `${firstName} ${lastName}`,
    county,
    countyCode,
    city,
    isBot: true,
    preferredCandidate: randomCandidate.slug,
    candidateId: randomCandidate.id,
    isReady: true, // Bots are always ready
    riskTolerance: Math.random(), // Random risk tolerance between 0-1
    agreeableness: Math.random() * 0.7 + 0.3, // Random agreeableness between 0.3-1
  };
}

export function selectBotDebateAnswer(
  botPlayer: BotPlayer,
  availableAnswers: { id: string; text: string; isRisky: boolean }[],
): string {
  if (!availableAnswers || availableAnswers.length === 0) {
    return "";
  }

  // Sort answers by risk level
  const sortedAnswers = [...availableAnswers].sort((a, b) => {
    // If bot has high risk tolerance, prefer risky answers
    if (botPlayer.riskTolerance > 0.7) {
      return a.isRisky === b.isRisky ? 0 : a.isRisky ? -1 : 1;
    }
    // If bot has low risk tolerance, avoid risky answers
    if (botPlayer.riskTolerance < 0.3) {
      return a.isRisky === b.isRisky ? 0 : a.isRisky ? 1 : -1;
    }
    // Otherwise, random selection
    return Math.random() - 0.5;
  });

  return sortedAnswers[0].id;
}

// Determine bot's vote for another player's answer
export function determineBotVote(
  botPlayer: BotPlayer,
  targetPlayerId: string,
  targetCandidateId: string | undefined,
  players: Array<{ playerId: string; candidateId?: string }>,
): Vote {
  // If target has no candidate, default to neutral
  if (!targetCandidateId) {
    return "neutral";
  }

  // Get bot's and target's candidate slugs
  const botCandidateSlug = botPlayer.candidateId
    ? candidateIdToSlugMap[botPlayer.candidateId]
    : botPlayer.preferredCandidate;
  const targetCandidateSlug = candidateIdToSlugMap[targetCandidateId];

  // Find candidate objects
  const botCandidate = candidates.find((c) => c.slug === botCandidateSlug);
  const targetCandidate = candidates.find((c) => c.slug === targetCandidateSlug);

  if (!botCandidate || !targetCandidate) {
    return "neutral";
  }

  // Calculate ideological distance between candidates
  const ideologicalDistance = Math.sqrt(
    (botCandidate.ideology.e - targetCandidate.ideology.e) ** 2 +
      (botCandidate.ideology.s - targetCandidate.ideology.s) ** 2 +
      (botCandidate.ideology.g - targetCandidate.ideology.g) ** 2,
  );

  // Normalize distance to 0-1 range (max possible distance is sqrt(12) ≈ 3.46)
  const normalizedDistance = ideologicalDistance / 3.46;

  // Adjust vote probability based on bot's agreeableness and ideological distance
  const agreeProb = Math.max(0, botPlayer.agreeableness - normalizedDistance * 0.7);
  const disagreeProb = Math.min(1, normalizedDistance * 0.6);

  // Random number to determine vote
  const rand = Math.random();

  if (rand < agreeProb) {
    return "agree";
  }

  if (rand > 1 - disagreeProb) {
    return "disagree";
  }

  return "neutral";
}

// Check if a player is a bot
export function isBot(playerId: string): boolean {
  return playerId.startsWith("bot-");
}
