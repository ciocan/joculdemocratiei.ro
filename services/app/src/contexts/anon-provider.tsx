import { createContext, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import ky from "ky";

import { createAnonymousUserProfile } from "@/utils/user";
import { Loading } from "@/components/loading";

type UserResponse = { token: string; userId: string };

export const AnonContext = createContext<UserResponse | null>(null);

export function AnonProvider({ children }: { children: React.ReactNode }) {
  const { mutate: createUserMutation, isPending: isCreatingUser } = useMutation({
    mutationFn: () => {
      const user = createAnonymousUserProfile();
      return ky.post<UserResponse>("/api/create-user", { json: user });
    },
    onSuccess: async (userResponse) => {
      const data = (await userResponse.json()) as UserResponse;
      localStorage.setItem("jd-token", data.token);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("jd-token");

    if (!token) {
      createUserMutation();
    }
  }, [createUserMutation]);

  if (isCreatingUser) {
    return <Loading />;
  }

  return children;
}
