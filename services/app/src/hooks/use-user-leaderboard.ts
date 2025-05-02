import { useQuery } from "@tanstack/react-query";

import { fetchData } from "@/utils/lib";
import type { LeaderboardData } from "@joculdemocratiei/utils";

export function useUserLeaderboard({ userId }: { userId: string }) {
  const {
    data: leaderboardData,
    isLoading,
    error,
  } = useQuery({
    retry: 0,
    queryKey: ["userLeaderboard", userId],
    queryFn: () => fetchData<LeaderboardData>("/api/get-user-leaderboard", { userId }),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    leaderboardData,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
