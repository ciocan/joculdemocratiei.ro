import type { CandidateSlug } from "../candidates";
import type { GamePlayer } from "./game";

export interface BotConfig {
  // Minimum number of real players before adding bots
  minRealPlayers: number;

  // Maximum number of bots to add to a room
  maxBotsPerRoom: number;

  // Whether bots are enabled
  enabled: boolean;

  // Delay range (min, max) in ms for bot actions to seem more human-like
  actionDelayRange: [number, number];
}

export interface BotPlayer extends GamePlayer {
  // Flag to identify bot players
  isBot: true;

  // The bot's preferred candidate (can be randomly assigned)
  preferredCandidate: CandidateSlug;

  // How likely the bot is to pick risky answers (0-1)
  riskTolerance: number;

  // How likely the bot is to agree with others (0-1)
  agreeableness: number;
}
