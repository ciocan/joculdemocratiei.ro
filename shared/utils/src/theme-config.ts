export type ThemeColor = "amber" | "blue";

export const defaultTheme: ThemeColor = "blue";

export function getAvatarPath(theme: ThemeColor = defaultTheme): string {
  return `/img/avatars/${theme}`;
}
