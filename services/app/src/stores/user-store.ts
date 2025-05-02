import { createWithEqualityFn } from "zustand/traditional";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

import type { UserProfile, UserData } from "@joculdemocratiei/utils";
import { createUserProfile } from "@/utils/user";

export type UserState = {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
};

export type UserActions = {
  setUser: (user: UserProfile | null) => void;
  createUser: (userData: UserData) => UserProfile;
  clearUser: () => void;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
};

const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
  isHydrated: false,
};

export const useUserStore = createWithEqualityFn<UserState & UserActions>()(
  immer(
    devtools(
      persist(
        (set) => ({
          ...initialState,
          setUser: (user) => set({ user }),
          createUser: (userData) => {
            const newUser = createUserProfile(userData);
            set({ user: newUser });
            return newUser;
          },
          clearUser: () => {
            set({ user: null });
          },
          setError: (error) => set({ error }),
          setIsLoading: (isLoading) => set({ isLoading }),
          setHydrated: (hydrated) => set({ isHydrated: hydrated }),
        }),
        {
          name: "user-storage",
          partialize: (state) => ({ user: state.user }),
          onRehydrateStorage: () => (state) => {
            state?.setHydrated(true);
          },
        },
      ),
      { name: "user-store" },
    ),
  ),
);

export const useUserProfile = () => {
  const state = useUserStore(
    (state) => ({
      user: state.user,
      isLoading: state.isLoading,
      isHydrated: state.isHydrated,
    }),
    shallow,
  );
  return state;
};

export const useUserError = () => {
  const state = useUserStore(
    (state) => ({
      error: state.error,
    }),
    shallow,
  );
  return state;
};

export const useUserActions = () => {
  const state = useUserStore(
    (state) => ({
      setUser: state.setUser,
      createUser: state.createUser,
      clearUser: state.clearUser,
      setError: state.setError,
      setIsLoading: state.setIsLoading,
    }),
    shallow,
  );
  return state;
};
