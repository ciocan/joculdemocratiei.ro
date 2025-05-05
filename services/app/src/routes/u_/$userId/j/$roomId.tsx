import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Heading,
  Text,
  Card,
  Grid,
  Flex,
  Table,
  Badge,
  Box,
  Callout,
  Tooltip,
  Separator,
  Avatar,
} from "@radix-ui/themes";
import {
  AwardIcon,
  BrainIcon,
  HeartIcon,
  TrophyIcon,
  MessageCircleQuestionIcon,
  InfoIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useGameDetails, type GameDetails } from "@/hooks/use-game-details";
import {
  getCandidateAvatarUrl,
  candidates,
  debateTopics,
  formatNumber,
} from "@joculdemocratiei/utils";
import { useThemeStore } from "@/stores/theme-store";

export const Route = createFileRoute("/u_/$userId/j/$roomId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId, roomId } = useParams({ from: "/u_/$userId/j/$roomId" });
  const { gameDetails, isLoading, error } = useGameDetails({ roomId });

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" gap="4" className="min-h-[70vh]">
        <Heading size="5">Se încarcă detaliile jocului...</Heading>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" align="center" justify="center" gap="4" className="min-h-[70vh]">
        <Heading size="5" color="red">
          Eroare la încărcarea detaliilor jocului
        </Heading>
        <Text size="3" color="red">
          {error}
        </Text>
        <Link to="/" className="mt-4">
          <Text size="3" color="blue" className="hover:underline">
            Înapoi la pagina principală
          </Text>
        </Link>
      </Flex>
    );
  }

  if (!gameDetails) {
    return (
      <Flex direction="column" align="center" justify="center" gap="4" className="min-h-[70vh]">
        <Heading size="5">Jocul nu a fost găsit</Heading>
        <Link to="/u/$userId" params={{ userId }} className="mt-4">
          <Text size="3" color="blue" className="hover:underline">
            Înapoi la pagina utilizatorului
          </Text>
        </Link>
      </Flex>
    );
  }

  return (
    <Flex direction="column" py="3" gap="4">
      <Flex direction="column" align="center" justify="center" gap="1">
        <Heading size="3" className="flex items-center gap-2">
          <TrophyIcon className="text-yellow-500" size={20} />
          Rezultate joc
        </Heading>
        <Text size="1" color="gray" align="center" className="flex items-center gap-2">
          Vezi cum s-au descurcat jucătorii în dezbatere. <InfoDialog />
        </Text>
      </Flex>
      <Flex direction="column" gap="6">
        <Box>
          <Heading size="4" mb="3" className="text-center">
            Participanți
          </Heading>
          <ParticipantsSection gameDetails={gameDetails} />
        </Box>
        <Separator size="4" my="3" />
        <Box>
          <Heading size="4" mb="3" className="text-center">
            Rezultate finale
          </Heading>
          <ResultsSection gameDetails={gameDetails} />
        </Box>
        <Separator size="4" my="3" />
        <Box>
          <Heading size="4" mb="3" className="text-center">
            Detalii runde
          </Heading>
          <RoundsSection gameDetails={gameDetails} />
        </Box>
      </Flex>
    </Flex>
  );
}

function ResultsSection({ gameDetails }: { gameDetails: GameDetails }) {
  const theme = useThemeStore((state) => state.theme);
  const sortedPlayers = [...gameDetails.finalScores].sort((a, b) => a.rank - b.rank);

  return (
    <Flex direction="column" gap="3" justify="center" align="center">
      {sortedPlayers.map((player, index) => {
        const candidate = candidates.find((c) => c.id === player.candidateId);

        let medal = null;
        if (index === 0) {
          medal = "🥇 Locul 1";
        } else if (index === 1) {
          medal = "🥈 Locul 2";
        } else if (index === 2) {
          medal = "🥉 Locul 3";
        }

        return (
          <div key={player.playerId} className="w-full max-w-[95%] md:max-w-[600px]">
            <Box className="relative">
              {medal && (
                <Badge
                  color="yellow"
                  size="2"
                  className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-10"
                >
                  {medal}
                </Badge>
              )}
              <Box
                className={`border-2 rounded-lg overflow-hidden ${
                  index === 0
                    ? "border-yellow-500 bg-yellow-500/5"
                    : index === 1
                      ? "border-gray-400 bg-gray-400/5"
                      : index === 2
                        ? "border-amber-700 bg-amber-700/5"
                        : "border-accent-6"
                }`}
              >
                <Flex p="3" gap="3" direction="column">
                  <Flex gap="3" align="center">
                    <Box className="relative">
                      <img
                        src={getCandidateAvatarUrl(candidate?.id || "", theme)}
                        alt={candidate?.name || "Candidat"}
                        className="size-16 rounded-full object-cover border-2 border-accent-6"
                      />
                    </Box>
                    <Flex direction="column" gap="1" className="flex-1">
                      <Flex justify="between" align="center">
                        <Heading size="3">{player.playerName}</Heading>
                        <Badge color="gray" size="1">
                          {player.city}, {player.county}
                        </Badge>
                      </Flex>
                      <Text size="2" color="gray">
                        {candidate?.name || "Candidat"}
                      </Text>
                      <Flex gap="2" justify="center">
                        <ScoreCard
                          icon={<BrainIcon className="text-blue-500 size-6" />}
                          label="Influență"
                          value={player.influence}
                          color="blue"
                          tooltip="Puncte de Influență - primite când alții sunt de acord cu tine"
                        />
                        <ScoreCard
                          icon={<HeartIcon className="text-red-500 size-6" />}
                          label="Empatie"
                          value={player.empathy}
                          color="red"
                          tooltip="Puncte de Empatie - primite când ești de acord cu alții"
                        />
                        <ScoreCard
                          icon={<AwardIcon className="text-yellow-500 size-6" />}
                          label="Armonie"
                          value={player.harmony}
                          color="yellow"
                          tooltip="Puncte de Armonie - calculate din Influență și Empatie"
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Box>
            </Box>
          </div>
        );
      })}
    </Flex>
  );
}

function RoundsSection({ gameDetails }: { gameDetails: GameDetails }) {
  const theme = useThemeStore((state) => state.theme);

  const allRounds = [];
  for (let roundNumber = 1; roundNumber <= gameDetails.totalRounds; roundNumber++) {
    const roundData = {
      roundNumber,
      players: gameDetails.players
        .map((player) => {
          const roundInfo = player.rounds.find((r) => r.roundNumber === roundNumber);
          if (!roundInfo) {
            return null;
          }

          return {
            playerId: player.playerId,
            playerName: player.playerName,
            candidateId: player.candidateId,
            answer: roundInfo.answer,
            debateTopic: roundInfo.debateTopic,
            debateQuestion: roundInfo.debateQuestion,
            influence: roundInfo.influence,
            empathy: roundInfo.empathy,
            harmony: roundInfo.harmony,
            totalScore: roundInfo.totalScore,
            agreeVotes: roundInfo.agreeVotes,
            neutralVotes: roundInfo.neutralVotes,
            disagreeVotes: roundInfo.disagreeVotes,
          };
        })
        .filter(Boolean),
    };

    if (roundData.players.length > 0) {
      allRounds.push(roundData);
    }
  }

  return (
    <Flex direction="column" gap="4" width="100%" className="max-w-[95%] mx-auto">
      {allRounds.map((round) => {
        const firstPlayer = round.players[0];

        if (!firstPlayer) {
          return null;
        }

        const debateTopic = debateTopics.find((t) => t.topicId === firstPlayer.debateTopic);

        return (
          <Card
            key={round.roundNumber}
            variant="surface"
            className="w-full border-1 border-accent-5 bg-accent-1 mb-4"
          >
            <Box p={{ initial: "2", xs: "3" }}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center" gap="2" className="p-1">
                  <Badge size={{ initial: "2", xs: "3" }}>{debateTopic?.topic}</Badge>
                  <Badge color="green" size={{ initial: "2", xs: "3" }} mr="auto">
                    Runda {round.roundNumber}
                  </Badge>
                </Flex>

                <Callout.Root className="w-full">
                  <Callout.Icon>
                    <MessageCircleQuestionIcon />
                  </Callout.Icon>
                  <Callout.Text>{firstPlayer.debateQuestion}</Callout.Text>
                </Callout.Root>

                <Box mt="3">
                  <Box className="hidden! xs:block!">
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Jucător</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Răspuns</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Scor</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {round.players.map((player) => {
                          if (!player) {
                            return null;
                          }
                          const candidate = candidates.find((c) => c.id === player.candidateId);

                          return (
                            <Table.Row key={player.playerId}>
                              <Table.Cell>
                                <Flex align="center" gap="2">
                                  <img
                                    src={getCandidateAvatarUrl(candidate?.id || "", theme)}
                                    alt={candidate?.name || "Candidat"}
                                    className="size-8 rounded-full object-cover"
                                  />
                                  <Text size="2" weight="medium">
                                    {player.playerName}
                                  </Text>
                                </Flex>
                              </Table.Cell>
                              <Table.Cell>
                                <Text size="2" className="break-words max-w-[200px] md:max-w-none">
                                  {player.answer || "Niciun răspuns"}
                                </Text>
                              </Table.Cell>
                              <Table.Cell>
                                <Flex gap="2" align="center">
                                  <Flex gap="1" align="center">
                                    <BrainIcon className="text-blue-500 size-4" />
                                    <Text size="2">{formatNumber(player.influence)}</Text>
                                  </Flex>
                                  <Flex gap="1" align="center">
                                    <HeartIcon className="text-red-500 size-4" />
                                    <Text size="2">{formatNumber(player.empathy)}</Text>
                                  </Flex>
                                  <Flex gap="1" align="center">
                                    <AwardIcon className="text-yellow-500 size-4" />
                                    <Text size="2">{formatNumber(player.harmony)}</Text>
                                  </Flex>
                                </Flex>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>

                  <Flex direction="column" gap="3" className="xs:hidden!">
                    {round.players.map((player) => {
                      if (!player) {
                        return null;
                      }
                      const candidate = candidates.find((c) => c.id === player.candidateId);

                      return (
                        <Card key={player.playerId} variant="surface" className="w-full">
                          <Box p="3">
                            <Flex direction="column" gap="3">
                              <Flex align="center" gap="2">
                                <img
                                  src={getCandidateAvatarUrl(candidate?.id || "", theme)}
                                  alt={candidate?.name || "Candidat"}
                                  className="size-8 rounded-full object-cover"
                                />
                                <Text size="2" weight="medium">
                                  {player.playerName}
                                </Text>
                              </Flex>

                              <Box className="border-t border-gray-4 pt-2">
                                <Text size="2" className="break-words">
                                  {player.answer || "Niciun răspuns"}
                                </Text>
                              </Box>

                              <Grid gap="1" className="border-t border-gray-4 pt-2">
                                <Text weight="medium" size="2" className="mb-1">
                                  Scor:
                                </Text>
                                <Flex wrap="wrap" gap="3">
                                  <Flex gap="1" align="center">
                                    <BrainIcon className="text-blue-500 size-4" />
                                    <Text size="2">{formatNumber(player.influence)}</Text>
                                  </Flex>
                                  <Flex gap="1" align="center">
                                    <HeartIcon className="text-red-500 size-4" />
                                    <Text size="2">{formatNumber(player.empathy)}</Text>
                                  </Flex>
                                  <Flex gap="1" align="center">
                                    <AwardIcon className="text-yellow-500 size-4" />
                                    <Text size="2">{formatNumber(player.harmony)}</Text>
                                  </Flex>
                                </Flex>
                              </Grid>
                            </Flex>
                          </Box>
                        </Card>
                      );
                    })}
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Card>
        );
      })}
    </Flex>
  );
}

function ScoreCard({
  icon,
  label,
  value,
  color,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "red" | "yellow";
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip}>
      <Card variant="surface" className="">
        <Flex direction="column" align="center" gap="0">
          <Flex align="center" justify="center" direction="column" gap="1">
            {icon}
            <Text size={{ initial: "1", xs: "2" }} weight="medium" color={color}>
              {label}
            </Text>
          </Flex>
          <Text size="4" weight="bold" color={color}>
            {formatNumber(value)}
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  );
}

function ParticipantsSection({ gameDetails }: { gameDetails: GameDetails }) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <Flex
      direction="row"
      gap="3"
      justify="center"
      align="center"
      wrap="wrap"
      className="max-w-[95%] mx-auto"
    >
      {gameDetails.players.map((player) => {
        const candidate = candidates.find((c) => c.id === player.candidateId);

        return (
          <Link
            key={player.playerId}
            to="/u/$userId"
            params={{ userId: player.playerId }}
            className="no-underline"
          >
            <Card
              variant="surface"
              className="border-1 border-accent-5 hover:border-accent-7 transition-colors"
            >
              <Flex p="3" gap="2" direction="column" align="center" className="w-[120px]">
                <Avatar
                  size="4"
                  radius="full"
                  fallback={player.playerName.substring(0, 2)}
                  src={getCandidateAvatarUrl(candidate?.id || "", theme)}
                  className="border-2 border-accent-6"
                />
                <Text size="2" weight="medium" align="center" className="line-clamp-1">
                  {player.playerName}
                </Text>
                <Badge size="1" color="gray" className="line-clamp-1">
                  {player.city}
                </Badge>
              </Flex>
            </Card>
          </Link>
        );
      })}
    </Flex>
  );
}

function InfoDialog() {
  return (
    <Tooltip content="Cum se calculează scorul">
      <InfoIcon className="size-4 text-accent-9 cursor-help" />
    </Tooltip>
  );
}
