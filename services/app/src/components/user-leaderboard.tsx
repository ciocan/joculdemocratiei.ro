import { Heading, Text, Card, Grid, Flex, Table, Badge, Skeleton } from "@radix-ui/themes";
import { AwardIcon, BrainIcon, HeartIcon, TrophyIcon } from "lucide-react";

import { formatNumber } from "@joculdemocratiei/utils";
import { useUserLeaderboard } from "@/hooks/use-user-leaderboard";

export function UserLeaderboard({ userId }: { userId: string }) {
  const { leaderboardData, isLoading, error } = useUserLeaderboard({ userId });

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  const hasNoData = !leaderboardData?.finalScores && !leaderboardData?.roundScores.length;

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

      {leaderboardData.roundScores.length > 0 && (
        <Card variant="classic">
          <Flex direction="column" gap="3" p="4">
            <Heading as="h3" size="3" align="center" color="gray">
              Rezultate jocuri
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell align="center">
                    <Text size="3" weight="bold" color="amber">
                      Joc
                    </Text>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    <BrainIcon className="text-blue-500 size-5" />
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    <HeartIcon className="text-red-500 size-5" />
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    <AwardIcon className="text-yellow-500 size-5" />
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell align="center">
                    <Text size="3" weight="bold" color="amber">
                      Total
                    </Text>
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {leaderboardData.roundScores.map((round, index) => (
                  <Table.Row key={index}>
                    <Table.Cell className="text-center">{round.roundNumber}</Table.Cell>
                    <Table.Cell className="text-center">{formatNumber(round.influence)}</Table.Cell>
                    <Table.Cell className="text-center">{formatNumber(round.empathy)}</Table.Cell>
                    <Table.Cell className="text-center">{formatNumber(round.harmony)}</Table.Cell>
                    <Table.Cell className="text-center">
                      {formatNumber(round.totalScore)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Card>
      )}
    </Grid>
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
