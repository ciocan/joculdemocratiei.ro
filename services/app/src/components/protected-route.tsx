import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Grid, Card, Heading, Button, Flex, Text, Box } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { useUserProfile } from "@/stores/user-store";
import { Loading } from "./loading";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
  redirectDelay?: number;
}

export function ProtectedRoute({
  children,
  redirectPath = "/incepe",
  redirectDelay = 5000,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isLoading, isHydrated } = useUserProfile();
  const [countdown, setCountdown] = useState(redirectDelay / 1000);

  const isAuthenticated = user !== null && isHydrated && !isLoading;

  useEffect(() => {
    if (!isHydrated || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate({ to: redirectPath });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, redirectPath, isAuthenticated, isHydrated, isLoading]);

  return (
    <Grid width="auto" gap="4">
      {!isHydrated || isLoading ? (
        <Loading />
      ) : !isAuthenticated ? (
        <Card variant="surface">
          <Flex direction="column" gap="4" p="4" align="center">
            <Box className="text-red-500">
              <ExclamationTriangleIcon className="size-8" />
            </Box>
            <Heading size="4" color="red">
              Acces restricționat
            </Heading>
            <Text align="center">Trebuie să ai un profil pentru a accesa această pagină.</Text>
            <Text align="center">
              Vei fi redirecționat în <strong>{countdown}</strong> secunde...
            </Text>
            <Button
              onClick={() => navigate({ to: redirectPath })}
              variant="solid"
              color="red"
              size="3"
              mt="2"
            >
              Mergi acum la pagina principală
            </Button>
          </Flex>
        </Card>
      ) : (
        children
      )}
    </Grid>
  );
}
