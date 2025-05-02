import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@radix-ui/themes";
import ky from "ky";

import type { UserData } from "@joculdemocratiei/utils";
import { useUserStore } from "@/stores/user-store";

export const TOTAL_PAGES = 7;
export const USERS_PER_PAGE = 3;
export const EMPTY_USER: UserData = {
  firstName: "",
  lastName: "",
  county: "",
  countyCode: "",
  city: "",
  lat: 0,
  lon: 0,
};

async function fetchUsers(): Promise<UserData[]> {
  const data = await ky.get("/api/generate-user").json<{ users: UserData[] }>();
  return data.users;
}

export function useNewUser() {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<string>("0");
  const navigate = useNavigate();

  const {
    data: users = [],
    error,
    refetch,
    isFetching,
    isLoading,
  } = useQuery<UserData[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const createUser = useUserStore((state) => state.createUser);

  const { mutate: createUserMutation, isPending: isCreatingUser } = useMutation({
    mutationFn: () => {
      const index = currentPage * USERS_PER_PAGE + Number.parseInt(selectedUser, 10);
      const selected = users[index];
      const user = createUser(selected);
      return ky.post("/api/create-user", { json: user });
    },
    onSuccess: async (jwt) => {
      const data = (await jwt.json()) as { token: string; userId: string; error?: string };
      if (data.error) {
        toast.error(data.error, {
          description: "Te rugăm să încerci mai târziu!",
          action: <Button onClick={() => refetch()}>Încercați din nou</Button>,
        });
      } else {
        localStorage.setItem("jd-token", data.token);
        toast.success("Utilizatorul a fost creat cu succes!");
        navigate({ to: "/u/$userId", params: { userId: data.userId } });
      }
    },
  });

  const handleNameChange = () => {
    setCurrentPage((prev) => {
      return (prev + 1) % TOTAL_PAGES;
    });
  };

  const handleNext = () => {
    createUserMutation();
  };

  const paginatedUsers: UserData[][] = [];
  for (let i = 0; i < TOTAL_PAGES; i++) {
    paginatedUsers.push(users.slice(i * USERS_PER_PAGE, (i + 1) * USERS_PER_PAGE));
  }
  const currentUsers = paginatedUsers[currentPage] || [EMPTY_USER, EMPTY_USER, EMPTY_USER];

  return {
    currentPage,
    selectedUser,
    setSelectedUser,
    error,
    refetch,
    isFetching,
    isLoading,
    isCreatingUser,
    handleNameChange,
    handleNext,
    currentUsers,
  };
}
