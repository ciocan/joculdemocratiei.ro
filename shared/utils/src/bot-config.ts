import type { BotConfig } from "./types/bot";

// Global bot configuration
export const GLOBAL_BOT_CONFIG: BotConfig = {
  // Minimum number of real players before adding bots
  minRealPlayers: 1,
  
  // Maximum number of bots to add to a room
  maxBotsPerRoom: 5,
  
  // Whether bots are enabled globally
  enabled: true,
  
  // Delay range (min, max) in ms for bot actions to seem more human-like
  actionDelayRange: [1000, 3000],
};
