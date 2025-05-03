import { createWithEqualityFn } from "zustand/traditional";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

import type { ThemeColor } from "@joculdemocratiei/utils";
import { defaultTheme } from "@joculdemocratiei/utils";

export type ThemeState = {
  theme: ThemeColor;
};

export type ThemeActions = {
  setTheme: (theme: ThemeColor) => void;
  toggleTheme: () => void;
};

const initialState: ThemeState = {
  theme: defaultTheme,
};

export const useThemeStore = createWithEqualityFn<ThemeState & ThemeActions>()(
  immer(
    devtools(
      persist(
        (set) => ({
          ...initialState,
          setTheme: (theme) => set({ theme }),
          toggleTheme: () =>
            set((state) => ({
              theme: state.theme === "amber" ? "blue" : "amber",
            })),
        }),
        {
          name: "theme-storage",
          partialize: (state) => ({ theme: state.theme }),
        },
      ),
      { name: "theme-store" },
    ),
  ),
  shallow,
);

// Convenience hook to get just the theme
export const useTheme = () => useThemeStore((state) => state.theme);
