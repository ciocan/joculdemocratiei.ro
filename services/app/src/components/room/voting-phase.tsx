import {
  Flex,
  Text,
  Card,
  Grid,
  RadioCards,
  Box,
  ScrollArea,
  Callout,
  Avatar,
  Tooltip,
  Badge,
  Progress,
} from "@radix-ui/themes";
import { MessageCircleQuestionIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { GamePlayer } from "@joculdemocratiei/utils";
import { candidates, VOTE_COUNTDOWN_TIME } from "@joculdemocratiei/utils";

import { useRoomState, useRoomVoting } from "@/contexts/room-context";
import { useRoomCountdown } from "@/hooks/use-room-countdown";
import { useVoteSounds } from "@/hooks/use-vote-sounds";
import { usePlayerLeaveSounds } from "@/hooks/use-player-leave-sounds";
import { cn } from "@/utils/lib";

export function VotingPhase() {
  const { players, currentUserId, candidateId, state } = useRoomState();
  const { answerTexts, debateTopic, playerAnswers, playerVotes, handleVote } = useRoomVoting();

  useVoteSounds(playerVotes || {}, currentUserId);
  usePlayerLeaveSounds(players, currentUserId);

  const countdownEndTime = state.context.countdownEndTime;
  const { countdown, progressPercentage } = useRoomCountdown({
    countdownEndTime,
    totalTimeMs: players.length <= 3 ? VOTE_COUNTDOWN_TIME / 2 : VOTE_COUNTDOWN_TIME,
  });

  const otherPlayersWithAnswers = players.filter(
    (player) => player.playerId !== currentUserId && playerAnswers?.[player.playerId],
  );

  const currentUserVotes = playerVotes?.[currentUserId || ""] || {};
  const scrollAreaHeight = "calc(100dvh - 300px)";

  return (
    <Grid gap="4" p="4">
      <Flex gap="4" align="center" justify="center">
        <AnimatePresence>
          {players.map((player: GamePlayer) => {
            const isCurrentUser = player.playerId === currentUserId;
            const hasVoted = Object.keys(playerVotes || {}).includes(player.playerId);
            const hasVotedForAll =
              hasVoted &&
              Object.keys(playerVotes?.[player.playerId] || {}).length === players.length - 1;
            return (
              <motion.div
                key={player.playerId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Tooltip content={player.name}>
                  <Flex
                    className={cn(
                      "p-2 rounded-full transition-all bg-gray-3",
                      isCurrentUser && "ring-1 ring-accent-9 bg-accent-3",
                      hasVotedForAll && "ring-1 ring-green-9",
                    )}
                  >
                    <Avatar
                      fallback={player.name.slice(0, 2).toUpperCase()}
                      size={{ initial: "1", xs: "3" }}
                      radius="full"
                    />
                  </Flex>
                </Tooltip>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Flex>

      <Flex justify="center" className="py-2">
        <Callout.Root className="w-full">
          <Callout.Icon>
            <MessageCircleQuestionIcon />
          </Callout.Icon>
          <Callout.Text>{debateTopic?.question}</Callout.Text>
        </Callout.Root>
      </Flex>
      <Flex direction="column" gap="1">
        <Progress value={progressPercentage} size="1" variant="surface" />
        <Flex justify="center">
          <Text size="2" weight="medium">
            {countdown} secunde ramase
          </Text>
        </Flex>
      </Flex>
      <Flex gap="2" align="center" justify="center">
        <Badge variant="soft" size="3" className="w-fit place-self-center">
          {candidates.find((c) => c.id === candidateId)?.name}
        </Badge>
        <Text size="2" weight="medium" color="gray">
          votează răspunsurile celorlalți candidați:
        </Text>
      </Flex>

      <ScrollArea type="auto" scrollbars="vertical" size="1" style={{ height: scrollAreaHeight }}>
        <Box className="w-full">
          {otherPlayersWithAnswers.length > 0 ? (
            <Grid gap="4">
              {otherPlayersWithAnswers.map((player) => {
                const answerId = playerAnswers?.[player.playerId]!;
                const answerText = answerTexts?.[answerId];
                const currentVote = currentUserVotes[player.playerId];

                return (
                  <Card
                    key={player.playerId}
                    className="p-4 bg-accent-1 border border-accent-7"
                    variant="surface"
                  >
                    <Grid gap="2">
                      <Callout.Root size="1" variant="soft" className="text-accent-9">
                        <Callout.Text size="3">{answerText}</Callout.Text>
                      </Callout.Root>
                      <RadioCards.Root
                        value={currentVote || ""}
                        onValueChange={(value) => {
                          if (value === "agree" || value === "neutral" || value === "disagree") {
                            handleVote(player.playerId, value);
                          }
                        }}
                      >
                        <Grid gap="1" columns="3" justify="center" className="mt-2">
                          <RadioCards.Item
                            value="agree"
                            className={cn(
                              "p-2 rounded-lg border transition-all",
                              currentVote === "agree"
                                ? "border-green-9 bg-green-3"
                                : "border-gray-6 hover:border-green-7 hover:bg-green-2",
                            )}
                          >
                            <Flex
                              gap="1"
                              align="center"
                              direction={{ initial: "column", xs: "row" }}
                            >
                              <span className="text-xl">😍</span>
                              <Text size={{ initial: "1", xs: "3" }} align="center">
                                Sunt de acord
                              </Text>
                            </Flex>
                          </RadioCards.Item>

                          <RadioCards.Item
                            value="neutral"
                            className={cn(
                              "p-2 rounded-lg border transition-all",
                              currentVote === "neutral"
                                ? "border-accent-9 bg-accent-3"
                                : "border-gray-6 hover:border-accent-7 hover:bg-accent-2",
                            )}
                          >
                            <Flex
                              gap="1"
                              align="center"
                              direction={{ initial: "column", xs: "row" }}
                            >
                              <span className="text-xl">🤷</span>
                              <Text size={{ initial: "1", xs: "3" }} align="center">
                                Mă abțin
                              </Text>
                            </Flex>
                          </RadioCards.Item>

                          <RadioCards.Item
                            value="disagree"
                            className={cn(
                              "p-2 rounded-lg border transition-all",
                              currentVote === "disagree"
                                ? "border-red-9 bg-red-3"
                                : "border-gray-6 hover:border-red-7 hover:bg-red-2",
                            )}
                          >
                            <Flex
                              gap="1"
                              align="center"
                              direction={{ initial: "column", xs: "row" }}
                            >
                              <span className="text-xl">🤬</span>
                              <Text size={{ initial: "1", xs: "3" }} align="center">
                                Nu sunt de acord
                              </Text>
                            </Flex>
                          </RadioCards.Item>
                        </Grid>
                      </RadioCards.Root>
                    </Grid>
                  </Card>
                );
              })}
            </Grid>
          ) : (
            <Flex direction="column" align="center" justify="center" gap="4" className="py-8">
              <Text size="3" color="gray">
                Nu există răspunsuri pentru a vota.
              </Text>
            </Flex>
          )}
        </Box>
      </ScrollArea>
    </Grid>
  );
}
