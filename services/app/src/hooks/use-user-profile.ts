import { useQuery } from "@tanstack/react-query";

import type { UserProfile } from "@joculdemocratiei/utils";
import { fetchData } from "@/utils/lib";

export function useUserProfile({ userId }: { userId: string }) {
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    retry: 0,
    queryKey: ["userProfile", userId],
    queryFn: () => fetchData<UserProfile>("/api/get-user-profile", { userId }),
    enabled: !!userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    userProfile,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
