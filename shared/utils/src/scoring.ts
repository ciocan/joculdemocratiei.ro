import type { Candidate } from "./candidates";
import { candidates } from "./candidates";

type VoteValue = "agree" | "neutral" | "disagree";

interface PlayerState {
  playerId: string;
  name: string;
  candidateId: string;
}

interface GameState {
  players: PlayerState[];
  playerVotes: Record<
    string, // voterId
    Record<string, VoteValue> // targetPlayerId -> vote
  >;
}

// Bridge-point weights for an "agree" based on ideological distance
const BP_WEIGHT = {
  close: 2, // Increased from 0.5
  neutral: 4, // Increased from 1
  opposite: 8, // Increased from 2
};
// Penalty for a "disagree"
const BP_DISAGREE = -2; // Increased penalty

// Empathy points the voter earns when casting a vote
const EP_WEIGHT: Record<VoteValue, number> = {
  agree: 2, // Increased from 1
  neutral: 0, // Unchanged
  disagree: -2, // Increased penalty
};

// Bonus points for strategic voting
const STRATEGIC_BONUS = {
  // Bonus for agreeing with someone very different from you
  crossIdeologyAgree: 3,
  // Bonus for being the most agreed-with player in a round
  mostAgreedWith: 5,
  // Bonus for having a high agree/disagree ratio (minimum 3 votes)
  highAgreeRatio: 4,
};

// Bucket thresholds (using normalised distance 0‒1)
const CLOSE_MAX = 0.25;
const NEUTRAL_MAX = 0.55;

// Maximum Euclidean distance in a 3-axis 0-100 cube
const MAX_DIST = Math.sqrt(3 * 100 * 100);

function normalisedDistance(a: Candidate, b: Candidate): number {
  const dx = a.ideology.e - b.ideology.e;
  const dy = a.ideology.s - b.ideology.s;
  const dz = a.ideology.g - b.ideology.g;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) / MAX_DIST;
}

function distanceBucket(a: Candidate, b: Candidate): "close" | "neutral" | "opposite" {
  const d = normalisedDistance(a, b);
  if (d < CLOSE_MAX) {
    return "close";
  }
  if (d < NEUTRAL_MAX) {
    return "neutral";
  }
  return "opposite";
}

export interface RoundScore {
  influence: number; // Σ Bridge Points received
  empathy: number; // Σ Empathy Points given (clamped ≥ 0)
  harmony: number; // ceil( √(influence × empathy) )
}

/**
 * Compute Bridge-Empathy scores for every player in a finished round.
 *
 * @param state      The round snapshot (phase === "results")
 * @param candidates The static candidate roster
 * @returns          Map playerId → RoundScore
 */
export function computeScores(state: GameState): Record<string, RoundScore> {
  /* --- lookup tables for quick access ----------------------------------- */
  const candById = new Map(candidates.map((c) => [c.id, c]));
  const playerById = new Map(state.players.map((p) => [p.playerId, p]));

  /* --- init result structure ------------------------------------------- */
  const scores: Record<string, RoundScore> = {};
  for (const p of state.players) {
    scores[p.playerId] = { influence: 0, empathy: 0, harmony: 0 };
  }

  // Track vote counts for bonuses
  const agreeCounts: Record<string, number> = {};
  const disagreeCounts: Record<string, number> = {};
  const totalVotes: Record<string, number> = {};

  for (const p of state.players) {
    agreeCounts[p.playerId] = 0;
    disagreeCounts[p.playerId] = 0;
    totalVotes[p.playerId] = 0;
  }

  /* --- process every single vote --------------------------------------- */
  for (const [voterId, targets] of Object.entries(state.playerVotes)) {
    const voter = playerById.get(voterId);
    if (!voter) {
      continue;
    }

    const voterCand = candById.get(voter.candidateId)!;
    let voterEmpathy = 0;

    for (const [targetId, vote] of Object.entries(targets)) {
      const target = playerById.get(targetId);
      if (!target) {
        continue;
      }

      const targetCand = candById.get(target.candidateId)!;
      totalVotes[targetId]++;

      // ---------- Empathy for voter ----------
      voterEmpathy += EP_WEIGHT[vote];

      // ---------- Bridge points for author ----------
      if (vote === "agree") {
        agreeCounts[targetId]++;
        const bucket = distanceBucket(voterCand, targetCand);
        scores[targetId].influence += BP_WEIGHT[bucket];

        // Cross-ideology bonus
        if (bucket === "opposite") {
          scores[voterId].empathy += STRATEGIC_BONUS.crossIdeologyAgree;
        }
      } else if (vote === "disagree") {
        disagreeCounts[targetId]++;
        scores[targetId].influence += BP_DISAGREE;
      }
    }

    scores[voterId].empathy += voterEmpathy;
  }

  // Apply strategic bonuses
  let maxAgrees = 0;
  for (const [_, agrees] of Object.entries(agreeCounts)) {
    maxAgrees = Math.max(maxAgrees, agrees);
  }

  for (const [playerId, agrees] of Object.entries(agreeCounts)) {
    // Most agreed-with bonus
    if (agrees === maxAgrees && agrees > 0) {
      scores[playerId].influence += STRATEGIC_BONUS.mostAgreedWith;
    }

    // High agree ratio bonus (at least 3 votes, 75%+ agree)
    const total = totalVotes[playerId];
    if (total >= 3 && agrees / total >= 0.75) {
      scores[playerId].influence += STRATEGIC_BONUS.highAgreeRatio;
    }
  }

  /* --- final Harmony computation --------------------------------------- */
  for (const [_, stat] of Object.entries(scores)) {
    // Empathy is never negative
    stat.empathy = Math.max(0, stat.empathy);

    // More granular harmony calculation
    const rawHarmony = Math.sqrt(Math.max(0, stat.influence * stat.empathy));
    // Round to 1 decimal place for more granular scores
    stat.harmony = Number(rawHarmony.toFixed(1));
  }

  return scores;
}
