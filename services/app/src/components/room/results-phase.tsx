import {
  Box,
  Flex,
  Text,
  Card,
  Avatar,
  Heading,
  Badge,
  Button,
  ScrollArea,
  Tooltip,
  Dialog,
  IconButton,
  Callout,
  Tabs,
  Table,
  Grid,
  Link,
} from "@radix-ui/themes";
import { motion } from "motion/react";
import {
  AwardIcon,
  TrophyIcon,
  BrainIcon,
  HeartIcon,
  RefreshCwIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
} from "lucide-react";

import { candidates, getCandidateAvatarUrl, isBot } from "@joculdemocratiei/utils";
import { useThemeStore } from "@/stores/theme-store";
import { useRoomResults } from "@/contexts/room-context";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { usePlayerLeaveSounds } from "@/hooks/use-player-leave-sounds";
import { cn } from "@/utils/lib";

export function ResultsPhase() {
  const {
    playerScores,
    players,
    currentUserId,
    handleNewGame,
    handleNextRound,
    currentRound,
    totalRounds,
    isFinalRound,
    roundsData,
    cumulativeScores,
    countdown,
  } = useRoomResults();

  const theme = useThemeStore((state) => state.theme);
  const { playFinalResultsSound } = useSoundEffects();

  const [activeTab, setActiveTab] = useState<string>(
    isFinalRound && currentRound > 0 ? "total" : currentRound.toString(),
  );

  useEffect(() => {
    const hasPlayed = { current: false };

    if (isFinalRound && !hasPlayed.current) {
      const timer = setTimeout(() => {
        playFinalResultsSound();
        hasPlayed.current = true;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isFinalRound, playFinalResultsSound]);

  usePlayerLeaveSounds(players, currentUserId);

  const sortedPlayers = [...players].sort((a, b) => {
    const scores =
      activeTab === "total"
        ? cumulativeScores
        : roundsData[Number.parseInt(activeTab, 10)]?.playerScores || playerScores;

    const scoreA = scores?.[a.playerId]?.harmony || 0;
    const scoreB = scores?.[b.playerId]?.harmony || 0;
    return scoreB - scoreA;
  });

  return (
    <Flex
      direction="column"
      py="3"
      gap="2"
      className="xs:min-h-[70%] min-h-[calc(100dvh-150px)] h-[calc(100dvh-80px)]"
    >
      <Flex direction="column" align="center" justify="center" gap="1">
        <Heading size="3" className="flex items-center gap-2">
          <TrophyIcon className="text-yellow-500" size={20} />
          {isFinalRound ? "Rezultate finale" : `Rezultate runda ${currentRound + 1}`}
        </Heading>
        <Text size="1" color="gray" align="center" className="flex items-center gap-2">
          Vezi cum te-ai descurcat în dezbatere. <InfoDialog />
        </Text>
      </Flex>

      {currentRound >= 0 && (
        <Flex justify="center" align="center" gap="2">
          <Tabs.Root
            defaultValue={isFinalRound && currentRound > 0 ? "total" : currentRound.toString()}
            onValueChange={(value) => setActiveTab(value)}
          >
            <Tabs.List>
              {Array.from({ length: currentRound + 1 }, (_, i) => (
                <Tabs.Trigger key={i} value={i.toString()}>
                  Runda {i + 1}
                </Tabs.Trigger>
              ))}
              {currentRound > 0 && <Tabs.Trigger value="total">Total</Tabs.Trigger>}
            </Tabs.List>
          </Tabs.Root>
        </Flex>
      )}

      <ScrollArea
        type="auto"
        scrollbars="vertical"
        size="1"
        className="flex-1"
        style={{ height: "calc(100dvh - 150px)" }}
      >
        <Flex direction="column" gap="3" justify="center" align="center" mt="4">
          {sortedPlayers.map((player, index) => {
            const isCurrentUser = player.playerId === currentUserId;
            const candidate = candidates.find((c) => c.id === player.candidateId);
            const scores =
              activeTab === "total"
                ? cumulativeScores
                : roundsData[Number.parseInt(activeTab, 10)]?.playerScores || playerScores;

            const playerScoreData = scores?.[player.playerId] || {
              influence: 0,
              empathy: 0,
              harmony: 0,
            };

            let medal = null;
            if (index === 0) {
              medal = "🥇 Locul 1";
            } else if (index === 1) {
              medal = "🥈 Locul 2";
            } else if (index === 2) {
              medal = "🥉 Locul 3";
            }

            const avatarUrl = player.candidateId
              ? getCandidateAvatarUrl(player.candidateId, theme)
              : "";

            return (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  className={cn(
                    "border border-accent-6 bg-accent-4/10 rounded-4 p-2",
                    isCurrentUser && "border-1 border-accent-9",
                  )}
                >
                  <Flex direction="column" p="2" gap="4">
                    <Flex justify="between" align="center" gap="2">
                      <Flex gap="2" align="center">
                        <Avatar
                          size="4"
                          src={avatarUrl}
                          fallback={candidate?.name?.[0] || "?"}
                          radius="full"
                          className={cn(
                            "border-2",
                            isCurrentUser ? "border-accent-9" : "border-gray-6",
                          )}
                        />
                        <Flex direction="column" align="start" justify="center" gap="1">
                          <Text
                            weight="bold"
                            size="2"
                            align="left"
                            className={cn(
                              "max-w-[120px] break-words",
                              isBot(player.playerId) && "text-green-10",
                            )}
                          >
                            {isBot(player.playerId) && <span className="text-lg mr-1">🤖</span>}
                            <span>{player.name}</span>
                          </Text>
                          <Badge size="1">{candidate?.name}</Badge>
                        </Flex>
                      </Flex>

                      {medal && (
                        <Badge
                          color={index === 0 ? "gold" : index === 1 ? "gray" : "bronze"}
                          variant="soft"
                          size="1"
                        >
                          {medal}
                        </Badge>
                      )}
                    </Flex>
                    <Flex gap="2" justify="center">
                      <ScoreCard
                        icon={<BrainIcon className="text-blue-500 size-6" />}
                        label="Influență"
                        value={playerScoreData.influence}
                        color="blue"
                        tooltip="Puncte de Influență - primite când alții sunt de acord cu tine"
                      />
                      <ScoreCard
                        icon={<HeartIcon className="text-red-500 size-6" />}
                        label="Empatie"
                        value={playerScoreData.empathy}
                        color="red"
                        tooltip="Puncte de Empatie - primite când ești de acord cu alții"
                      />
                      <ScoreCard
                        icon={<AwardIcon className="text-yellow-500 size-6" />}
                        label="Armonie"
                        value={playerScoreData.harmony}
                        color="yellow"
                        tooltip="Puncte de Armonie - calculate din Influență și Empatie"
                      />
                    </Flex>
                  </Flex>
                </Box>
              </motion.div>
            );
          })}
        </Flex>

        {isFinalRound && <AllRoundsAnswers />}
      </ScrollArea>
      <Grid justify="center" m="4" gap="2" position="sticky">
        {currentRound < totalRounds - 1 && (
          <Button
            size="3"
            variant="solid"
            onClick={handleNextRound}
            disabled={countdown > 0}
            className="w-full"
          >
            <RefreshCwIcon size={14} />
            {countdown > 0 ? `Runda următoare în ${countdown}s...` : "Runda următoare"}
          </Button>
        )}
        {currentRound === totalRounds - 1 && (
          <Button size="3" variant="solid" onClick={handleNewGame} className="">
            <RefreshCwIcon size={14} />
            Joc nou
          </Button>
        )}
      </Grid>
    </Flex>
  );
}

function AllRoundsAnswers() {
  const { players, roundsData, totalRounds } = useRoomResults();
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const theme = useThemeStore((state) => state.theme);

  // Function to render vote badge based on vote type
  const renderVoteBadge = (vote: string | undefined) => {
    if (vote === "agree") {
      return <Badge color="green">❤️</Badge>;
    }

    if (vote === "neutral") {
      return <Badge color="gray">🤷</Badge>;
    }

    if (vote === "disagree") {
      return <Badge color="red">🤬</Badge>;
    }

    return <Badge color="gray">-</Badge>;
  };

  return (
    <Flex direction="column" gap="4" mt="6" width="100%" className="max-w-[95%] mx-auto">
      <Heading size={{ initial: "3", xs: "4" }} className="flex justify-center items-center gap-2">
        <MessageCircleIcon size={18} />
        Toate răspunsurile și voturile
      </Heading>

      {Array.from({ length: totalRounds }, (_, roundIndex) => {
        const roundData = roundsData[roundIndex];
        if (!roundData) {
          return null;
        }

        const isExpanded = expandedRound === roundIndex;

        return (
          <Card
            key={roundIndex}
            variant="surface"
            className="w-full border-1 border-accent-5 bg-accent-1"
          >
            <Box p={{ initial: "2", xs: "3" }}>
              <Flex direction="column" gap="2">
                <Flex
                  justify="between"
                  align="center"
                  gap="2"
                  onClick={() => setExpandedRound(isExpanded ? null : roundIndex)}
                  className="cursor-pointer p-1"
                >
                  <Badge size={{ initial: "2", xs: "3" }}>{roundData.debateTopic.topic}</Badge>
                  <Badge color="green" size={{ initial: "2", xs: "3" }} mr="auto">
                    Runda {roundIndex + 1}
                  </Badge>
                  <Text weight="bold" color="blue" className="hover:underline text-sm">
                    {isExpanded ? "Ascunde detalii" : "Vezi detalii"}
                  </Text>
                </Flex>

                {roundData.debateTopic && (
                  <Callout.Root className="w-full">
                    <Callout.Icon>
                      <MessageCircleQuestionIcon />
                    </Callout.Icon>
                    <Callout.Text>{roundData.debateTopic.question}</Callout.Text>
                  </Callout.Root>
                )}

                {isExpanded && (
                  <Box mt="3">
                    <Box className="hidden! xs:block!">
                      <Table.Root>
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeaderCell>Jucător</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Răspuns</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Voturi primite</Table.ColumnHeaderCell>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {players.map((player) => {
                            const answerId = roundData.playerAnswers?.[player.playerId];
                            const answerText = answerId ? roundData.answerTexts?.[answerId] : null;

                            const votesForPlayer: Record<string, string> = {};

                            if (roundData.playerVotes) {
                              for (const [voterId, votes] of Object.entries(
                                roundData.playerVotes,
                              )) {
                                if (votes[player.playerId]) {
                                  const voterName =
                                    players.find((p) => p.playerId === voterId)?.name || voterId;
                                  votesForPlayer[voterName] = votes[player.playerId];
                                }
                              }
                            }

                            return (
                              <Table.Row key={player.playerId}>
                                <Table.Cell>
                                  <Flex gap="2" align="center">
                                    <Avatar
                                      size="2"
                                      src={
                                        player.candidateId
                                          ? getCandidateAvatarUrl(player.candidateId, theme)
                                          : ""
                                      }
                                      fallback={player.name[0] || "?"}
                                      radius="full"
                                    />
                                    <Text
                                      size="1"
                                      align="left"
                                      weight="medium"
                                      className={cn(
                                        "break-words",
                                        isBot(player.playerId) && "text-green-10",
                                      )}
                                    >
                                      {isBot(player.playerId) && (
                                        <span className="text-lg mr-1">🤖</span>
                                      )}
                                      <span>{player.name}</span>
                                    </Text>
                                  </Flex>
                                </Table.Cell>
                                <Table.Cell>
                                  <Flex direction="column" gap="1">
                                    <Text
                                      size="2"
                                      className="break-words max-w-[200px] md:max-w-none text-accent-9"
                                    >
                                      {answerText || "Niciun răspuns"}
                                    </Text>
                                    {answerId &&
                                      roundData.debateAnswers?.[player.playerId]?.find(
                                        (a) => a.id === answerId,
                                      )?.source && (
                                        <Link
                                          href={
                                            roundData.debateAnswers[player.playerId].find(
                                              (a) => a.id === answerId,
                                            )?.source
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          color="blue"
                                          className="hover:underline"
                                        >
                                          Sursa
                                        </Link>
                                      )}
                                  </Flex>
                                </Table.Cell>
                                <Table.Cell>
                                  <Flex wrap="wrap" gap="1">
                                    {Object.entries(votesForPlayer).map(
                                      ([voterName, vote], idx) => (
                                        <Tooltip key={idx} content={`${voterName}`}>
                                          {renderVoteBadge(vote)}
                                        </Tooltip>
                                      ),
                                    )}
                                    {Object.keys(votesForPlayer).length === 0 && (
                                      <Text size="1" color="gray">
                                        Niciun vot
                                      </Text>
                                    )}
                                  </Flex>
                                </Table.Cell>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table.Root>
                    </Box>

                    <Flex direction="column" gap="3" className="xs:hidden!">
                      {players.map((player) => {
                        const answerId = roundData.playerAnswers?.[player.playerId];
                        const answerText = answerId ? roundData.answerTexts?.[answerId] : null;

                        const votesForPlayer: Record<string, string> = {};

                        if (roundData.playerVotes) {
                          for (const [voterId, votes] of Object.entries(roundData.playerVotes)) {
                            if (votes[player.playerId]) {
                              const voterName =
                                players.find((p) => p.playerId === voterId)?.name || voterId;
                              votesForPlayer[voterName] = votes[player.playerId];
                            }
                          }
                        }

                        return (
                          <Card
                            key={player.playerId}
                            variant="surface"
                            className="border border-gray-5"
                          >
                            <Box p="2">
                              <Flex direction="column" gap="2">
                                <Flex gap="2" align="center">
                                  <Avatar
                                    size="2"
                                    src={
                                      player.candidateId
                                        ? getCandidateAvatarUrl(player.candidateId, theme)
                                        : ""
                                    }
                                    fallback={player.name[0] || "?"}
                                    radius="full"
                                  />
                                  <Text
                                    size="2"
                                    align="left"
                                    weight="medium"
                                    className={cn(
                                      "break-words",
                                      isBot(player.playerId) && "text-green-10",
                                    )}
                                  >
                                    {isBot(player.playerId) && (
                                      <span className="text-lg mr-1">🤖</span>
                                    )}
                                    <span>{player.name}</span>
                                  </Text>
                                </Flex>

                                <Box className="border-t border-gray-4 pt-2">
                                  <Flex direction="column" gap="1">
                                    <Text size="2" className="break-words text-accent-9">
                                      {answerText || "Niciun răspuns"}
                                    </Text>
                                    {answerId &&
                                      roundData.debateAnswers?.[player.playerId]?.find(
                                        (a) => a.id === answerId,
                                      )?.source && (
                                        <Link
                                          href={
                                            roundData.debateAnswers[player.playerId].find(
                                              (a) => a.id === answerId,
                                            )?.source
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline"
                                          color="blue"
                                        >
                                          Sursa
                                        </Link>
                                      )}
                                  </Flex>
                                </Box>

                                <Grid gap="1" className="border-t border-gray-4 pt-2">
                                  <Text weight="medium" size="2" className="mb-1">
                                    Voturi primite:
                                  </Text>
                                  <Flex wrap="wrap" gap="1">
                                    {Object.entries(votesForPlayer).map(
                                      ([voterName, vote], idx) => (
                                        <Tooltip key={idx} content={`${voterName}`}>
                                          {renderVoteBadge(vote)}
                                        </Tooltip>
                                      ),
                                    )}
                                    {Object.keys(votesForPlayer).length === 0 && (
                                      <Text size="1" color="gray">
                                        Niciun vot
                                      </Text>
                                    )}
                                  </Flex>
                                </Grid>
                              </Flex>
                            </Box>
                          </Card>
                        );
                      })}
                    </Flex>
                  </Box>
                )}
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
            {value}
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  );
}

function InfoDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <IconButton
          variant="soft"
          color="blue"
          size="1"
          className="hover:scale-110 transition-transform"
        >
          <InfoCircledIcon className="size-4" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content className="grid grid-cols-1 gap-2">
        <Dialog.Title className="text-accent-9 flex items-center gap-2" size="2">
          <TrophyIcon className="text-yellow-500" size={18} />
          Cum se calculează scorul tău
        </Dialog.Title>
        <Dialog.Description>
          <ScrollArea className="max-h-[70dvh]">
            <Flex direction="column" gap="4">
              <Card variant="surface" className="border border-blue-500/30 bg-blue-500/5">
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <BrainIcon className="text-blue-500 size-4" />
                    <Text size="3" weight="bold" color="blue">
                      1. Puncte de Influență
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="2">
                      Primești puncte când alt jucător dă ❤️ „Sunt de acord" răspunsului tău.
                    </Text>
                    <Text size="2">
                      Cu cât candidatul lui este mai departe de al tău pe harta ideologică, cu atât
                      bonusul e mai mare.
                    </Text>
                  </Flex>
                </Flex>
              </Card>
              <Card variant="surface" className="border border-red-500/30 bg-red-500/5">
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <HeartIcon className="text-red-500 size-4" />
                    <Text size="3" weight="bold" color="red">
                      2. Puncte de Empatie
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="2">Pentru fiecare vot pe care îl dai:</Text>
                    <Flex gap="2" justify="center" className="py-1">
                      <Badge color="green" size="2">
                        ❤️ = +1
                      </Badge>
                      <Badge color="gray" size="2">
                        🤷 = 0
                      </Badge>
                      <Badge color="red" size="2">
                        🤬 = -1
                      </Badge>
                    </Flex>
                    <Text size="2">Respectul acordat altora îți crește propriul scor.</Text>
                  </Flex>
                </Flex>
              </Card>
              <Card variant="surface" className="border border-yellow-500/30 bg-yellow-500/5">
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <AwardIcon className="text-yellow-500 size-4" />
                    <Text size="3" weight="bold" color="yellow">
                      3. Scorul final - Armonie
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="2">La sfârșitul rundei, jocul combină cele două valori:</Text>
                    <Text size="2" weight="medium" className="text-center py-1">
                      Armonie = 🤝 Puncte de Influență x Puncte de Empatie
                    </Text>
                    <Text size="2">
                      Nu poți câștiga doar cu laude de la prieteni sau doar fiind drăguț; ai nevoie
                      de ambele: să convingi adversari și să votezi civilizat.
                    </Text>
                  </Flex>
                </Flex>
              </Card>
              <Callout.Root size="1" color="green">
                <Callout.Icon>
                  <TrophyIcon size={16} />
                </Callout.Icon>
                <Callout.Text>
                  Construiește punți, arată empatie și vei urca în clasament!
                </Callout.Text>
              </Callout.Root>
            </Flex>
          </ScrollArea>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
}
