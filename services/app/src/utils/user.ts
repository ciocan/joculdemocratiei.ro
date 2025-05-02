import {
  type UserData,
  type UserProfile,
  removeDiacritics,
  slugify,
} from "@joculdemocratiei/utils";

export function createUserProfile(userData: UserData): UserProfile {
  const userId = `${slugify(
    removeDiacritics(`${userData.firstName}-${userData.lastName.substring(0, 1)}`),
  )}-${crypto.randomUUID().substring(0, 8)}`;

  const secretKey = crypto.randomUUID();
  return { userId, secretKey, ...userData };
}

export function clearUserToken(): void {
  try {
    localStorage.removeItem("jd-token");
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
}

export function createAnonymousUserProfile(): UserProfile {
  const userId = `${slugify(removeDiacritics("Anonim"))}-${crypto.randomUUID().substring(0, 16)}`;
  const secretKey = crypto.randomUUID();
  return {
    userId,
    secretKey,
    firstName: "Anonim",
    lastName: "Anonim",
    county: "Anonim",
    countyCode: "Anonim",
    city: "Anonim",
    lat: 0,
    lon: 0,
  };
}
