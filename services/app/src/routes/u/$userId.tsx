import { Suspense } from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { Heading, Text, Grid, Card, Flex, Button, Skeleton, Avatar, Badge } from "@radix-ui/themes";
import { CrossCircledIcon, PlayIcon, Share1Icon } from "@radix-ui/react-icons";
import { AnimatePresence } from "motion/react";

import type { UserProfile } from "@joculdemocratiei/utils";
import { TextAnimate } from "@/components/animations/text-animate";
import { Loading } from "@/components/loading";
import { UserLeaderboard } from "@/components/user-leaderboard";
import { Footer } from "@/components/footer";
import { useUserProfile } from "@/hooks/use-user-profile";
import { shareRoom } from "@/components/share";

export const Route = createFileRoute("/u/$userId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = useParams({ from: "/u/$userId" });
  const { userProfile, isLoading, error } = useUserProfile({ userId });

  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <Grid gap="4" p="4">
        <Card variant="classic">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <UserNotFound message={`Nu am putut găsi utilizatorul cu ID-ul: ${userId}`} />
          ) : userProfile ? (
            <UserProfileCard user={userProfile} />
          ) : null}
        </Card>
        {userProfile && <UserLeaderboard userId={userProfile.userId} />}
        <Footer />
      </Grid>
    </Suspense>
  );
}

function UserProfileCard({ user }: { user: UserProfile }) {
  const navigate = useNavigate();
  const initials = user.firstName.charAt(0) + user.lastName.charAt(0);

  const handleStartNewGame = () => {
    navigate({ to: "/joc-nou" });
  };

  return (
    <Grid width="auto" gap="6" p="4" minHeight="200px">
      <Flex direction="column" width="100%" gap="4" align="center">
        <Avatar size="6" fallback={initials} radius="full" />
        <Badge size="2">{user.userId}</Badge>
        <Flex direction="column" gap="1" align="center">
          <AnimatePresence mode="wait">
            <Heading
              as="h1"
              size="6"
              align="center"
              key={`name-${user.firstName}-${user.lastName}`}
            >
              <TextAnimate
                key={`${user.firstName}-${user.lastName}`}
                text={`${user.firstName} ${user.lastName}`}
                type="popIn"
                delay={0.3}
                duration={0.8}
              />
            </Heading>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <Heading
              as="h3"
              size="2"
              align="center"
              className="font-normal!"
              key={`location-${user.city}-${user.county}`}
            >
              <TextAnimate
                key={`${user.city}-${user.county}`}
                text={`${user.city}, ${user.county}`}
                type="popIn"
                delay={0.5}
                duration={0.8}
              />
            </Heading>
          </AnimatePresence>
        </Flex>
      </Flex>
      <Flex gap="4" justify="center" direction={{ initial: "column", sm: "row" }}>
        <Button onClick={handleStartNewGame} size="3" className="">
          <PlayIcon className="size-4" /> Incepe joc nou
        </Button>
        <Button variant="outline" size="3" onClick={shareRoom}>
          <Share1Icon className="size-4" /> Împărtășește
        </Button>
      </Flex>
    </Grid>
  );
}

function UserProfileSkeleton() {
  return (
    <Grid width="auto" mt="2" p="4" gap="4">
      <Card variant="classic">
        <Grid width="auto" gap="6" p="4" minHeight="200px">
          <Flex
            direction="column"
            width="100%"
            gap="3"
            minHeight="180px"
            justify="center"
            align="center"
          >
            <Skeleton className="size-24 rounded-full" />
            <Skeleton height="24px" width="200px" className="my-1" />
            <Skeleton height="16px" width="150px" className="my-1" />
          </Flex>
        </Grid>
      </Card>
    </Grid>
  );
}

function UserNotFound({ message }: { message: string }) {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate({ to: "/" });
  };

  return (
    <Grid p="4" py="8" gap="4" minHeight="200px" justify="center" align="center">
      <Flex direction="column" align="center" gap="4">
        <CrossCircledIcon className="size-12 text-red-500" />
        <Heading as="h2" size="6" align="center">
          Utilizator negăsit
        </Heading>
        <Text size="2" align="center" color="gray">
          Eroare: <strong>{message}</strong>
        </Text>
        <Button size="3" variant="solid" onClick={handleBackHome}>
          Înapoi la pagina principală
        </Button>
      </Flex>
    </Grid>
  );
}
