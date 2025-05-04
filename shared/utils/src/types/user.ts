export type UserData = {
  firstName: string;
  lastName: string;
  county: string;
  countyCode: string;
  city: string;
  lat: number;
  lon: number;
};

export type UserProfile = UserData & {
  userId: string;
  secretKey: string;
};

export type LeaderboardRoundScore = {
  influence: number;
  empathy: number;
  harmony: number;
  totalScore: number;
  agreeVotes: number;
  neutralVotes: number;
  disagreeVotes: number;
  roundNumber: number;
  debateTopic: string;
  debateQuestion: string;
  answer: string | null;
  roomId: string;
};

export type GameData = {
  roomId: string;
  rounds: LeaderboardRoundScore[];
  createdAt?: number;
};

export type LeaderboardData = {
  games: GameData[];
  roundScores: LeaderboardRoundScore[]; // Keep for backward compatibility
  finalScores: {
    influence: number;
    empathy: number;
    harmony: number;
    totalScore: number;
    totalPlayers: number;
    rank: number;
  } | null;
};
