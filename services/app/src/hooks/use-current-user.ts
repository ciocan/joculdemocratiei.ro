import { useUserStore } from "@/stores/user-store";

/**
 * Hook to access the current user from the Zustand store
 * @returns The current user or null if not logged in
 */
export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  return user;
}
