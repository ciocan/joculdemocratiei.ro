import { Heading, Text, Card, Grid, Flex, Table, Badge, Skeleton, Box } from "@radix-ui/themes";
import { AwardIcon, BrainIcon, HeartIcon, TrophyIcon } from "lucide-react";

import { formatNumber, type GameData, type LeaderboardRoundScore } from "@joculdemocratiei/utils";
import { useUserLeaderboard } from "@/hooks/use-user-leaderboard";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export function UserLeaderboard({ userId }: { userId: string }) {
  const { leaderboardData, isLoading, error } = useUserLeaderboard({ userId });

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  const hasNoData =
    !leaderboardData?.finalScores &&
    (!leaderboardData?.games || leaderboardData.games.length === 0) &&
    (!leaderboardData?.roundScores || leaderboardData.roundScores.length === 0);

  if (error) {
    return (
      <Card variant="classic">
        <Flex direction="column" gap="3" p="4" align="center">
          <Heading as="h3" size="3" align="center">
            Eroare la încărcarea datelor
          </Heading>
          <Text size="2" color="red">
            {error}
          </Text>
        </Flex>
      </Card>
    );
  }

  if (hasNoData) {
    return (
      <Grid gap="4" align="center">
        <Card variant="classic">
          <Flex direction="column" gap="3" p="4" align="center">
            <Heading as="h3" size="3" align="center">
              Nu ai încă date în clasament
            </Heading>
            <Text size="2" color="gray" align="center">
              Participă la un joc pentru a-ți vedea rezultatele în clasament!
            </Text>
          </Flex>
        </Card>
        <LeaderboardSkeleton />
      </Grid>
    );
  }

  return (
    <Grid width="auto" gap="4">
      {leaderboardData.finalScores && (
        <Card variant="classic">
          <Flex direction="column" gap="3" p="4">
            <Heading as="h3" size="4" align="center">
              Rezultate finale
            </Heading>
            <Grid columns="1" gap="3">
              <StatCard
                title="Scor total"
                icon={<TrophyIcon className="size-12" />}
                value={leaderboardData.finalScores.totalScore}
                total={leaderboardData.finalScores.totalScore}
              />
              <Grid columns="3" gap="3">
                <StatCard
                  title="Influență"
                  color="blue"
                  icon={<BrainIcon className="text-blue-500 size-8" />}
                  value={leaderboardData.finalScores.influence}
                  total={leaderboardData.finalScores.totalScore}
                />
                <StatCard
                  title="Empatie"
                  color="red"
                  icon={<HeartIcon className="text-red-500 size-8" />}
                  value={leaderboardData.finalScores.empathy}
                  total={leaderboardData.finalScores.totalScore}
                />
                <StatCard
                  title="Armonie"
                  color="yellow"
                  icon={<AwardIcon className="text-yellow-500 size-8" />}
                  value={leaderboardData.finalScores.harmony}
                  total={leaderboardData.finalScores.totalScore}
                />
              </Grid>
            </Grid>
            <Flex justify="center" mt="2">
              <Badge size="2" color="blue">
                Locul {leaderboardData.finalScores.rank} din{" "}
                {leaderboardData.finalScores.totalPlayers}
              </Badge>
            </Flex>
          </Flex>
        </Card>
      )}

      {leaderboardData.games && leaderboardData.games.length > 0 && (
        <Card variant="classic">
          <Flex direction="column" gap="3" p="4">
            <Heading as="h3" size="3" align="center" color="gray">
              Rezultate jocuri
            </Heading>
            <Accordion type="multiple" className="w-full">
              {leaderboardData.games.map((game, gameIndex) => (
                <GameAccordionItem key={gameIndex} game={game} gameIndex={gameIndex} />
              ))}
            </Accordion>
          </Flex>
        </Card>
      )}
    </Grid>
  );
}

function GameAccordionItem({ game, gameIndex }: { game: GameData; gameIndex: number }) {
  // Calculate game totals
  const gameTotals = game.rounds.reduce(
    (acc, round) => {
      acc.influence += round.influence;
      acc.empathy += round.empathy;
      acc.harmony += round.harmony;
      acc.totalScore += round.totalScore;
      return acc;
    },
    { influence: 0, empathy: 0, harmony: 0, totalScore: 0 },
  );

  return (
    <AccordionItem value={`game-${gameIndex}`}>
      <AccordionTrigger>
        <Flex direction="column" width="100%" py="2" gap="2">
          <Grid columns={{ initial: "1", md: "2" }} gap="2">
            <Flex justify="between" align="center" width="100%">
              <Flex gap="2" align="center">
                <Badge size="1" color="gray" variant="soft">
                  Joc {gameIndex + 1}
                </Badge>
                <Text size="2" weight="medium">
                  {game.rounds.length} runde
                </Text>
              </Flex>
            </Flex>
            <Flex justify="between" align="center" width="100%">
              <Flex gap="4" className="w-fit justify-end">
                <Flex gap="1" align="center" className="w-1/4 justify-center">
                  <BrainIcon className="text-blue-500 size-4" />
                  <Text size="2" className="tabular-nums">
                    {formatNumber(gameTotals.influence)}
                  </Text>
                </Flex>
                <Flex gap="1" align="center" className="w-1/4 justify-center">
                  <HeartIcon className="text-red-500 size-4" />
                  <Text size="2" className="tabular-nums">
                    {formatNumber(gameTotals.empathy)}
                  </Text>
                </Flex>
                <Flex gap="1" align="center" className="w-1/4 justify-center">
                  <AwardIcon className="text-yellow-500 size-4" />
                  <Text size="2" className="tabular-nums">
                    {formatNumber(gameTotals.harmony)}
                  </Text>
                </Flex>
                <Flex gap="1" align="center" className="w-1/4 justify-center">
                  <Text size="2" weight="bold" className="tabular-nums">
                    {formatNumber(gameTotals.totalScore)}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </AccordionTrigger>
      <AccordionContent>
        <Box py="3" px="1">
          <RoundsTable rounds={game.rounds} />
        </Box>
      </AccordionContent>
    </AccordionItem>
  );
}

function RoundsTable({ rounds }: { rounds: LeaderboardRoundScore[] }) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell align="center" className="w-1/5">
            <Text size="2" weight="bold" className="text-accent-9">
              Rundă
            </Text>
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center" className="w-1/5">
            <BrainIcon className="text-blue-500 size-4 mx-auto" />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center" className="w-1/5">
            <HeartIcon className="text-red-500 size-4 mx-auto" />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center" className="w-1/5">
            <AwardIcon className="text-yellow-500 size-4 mx-auto" />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center" className="w-1/5">
            <Text size="2" weight="bold" className="text-accent-9">
              Total
            </Text>
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rounds.map((round, index) => (
          <Table.Row key={index}>
            <Table.Cell className="text-center">{round.roundNumber}</Table.Cell>
            <Table.Cell className="text-center tabular-nums">
              {formatNumber(round.influence)}
            </Table.Cell>
            <Table.Cell className="text-center tabular-nums">
              {formatNumber(round.empathy)}
            </Table.Cell>
            <Table.Cell className="text-center tabular-nums">
              {formatNumber(round.harmony)}
            </Table.Cell>
            <Table.Cell className="text-center tabular-nums">
              {formatNumber(round.totalScore)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function StatCard({
  title,
  value,
  total,
  icon,
  color,
  className,
}: {
  title: string;
  value: number;
  total: number;
  color?: "blue" | "red" | "yellow" | "gray";
  className?: string;
  icon: React.ReactNode;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card variant="surface" className={className}>
      <Flex direction="column" gap="1" p="2" align="center">
        {icon}
        <Text size="3" weight="medium" color={color}>
          {title}
        </Text>
        <Text size="5" weight="bold" color={color}>
          {formatNumber(value)}
        </Text>
        <Text size="3" color="gray">
          {percentage}%
        </Text>
      </Flex>
    </Card>
  );
}

function LeaderboardSkeleton({ loading = true }: { loading?: boolean }) {
  return (
    <Grid gap="4" className="w-full">
      <Card variant="surface">
        <Flex direction="column" gap="3" p="2" className="">
          <Skeleton loading={loading} height="24px" />
          <Grid columns="2" gap="3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="surface">
                <Flex direction="column" gap="1" p="2" align="center">
                  <Skeleton height="16px" width="80px" loading={loading} />
                  <Skeleton height="24px" width="40px" loading={loading} />
                  <Skeleton height="16px" width="30px" loading={loading} />
                </Flex>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Card>
    </Grid>
  );
}
