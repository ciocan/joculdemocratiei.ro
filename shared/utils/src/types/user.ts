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

export type LeaderboardData = {
  roundScores: {
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
  }[];
  finalScores: {
    influence: number;
    empathy: number;
    harmony: number;
    totalScore: number;
    totalPlayers: number;
    rank: number;
  } | null;
};
