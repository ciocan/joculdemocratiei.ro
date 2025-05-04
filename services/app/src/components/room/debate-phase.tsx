import {
  Flex,
  Tooltip,
  Text,
  RadioCards,
  Box,
  Grid,
  ScrollArea,
  Callout,
  Badge,
  Progress,
} from "@radix-ui/themes";
import { MessageCircleQuestionIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { GameMessage, GamePlayer } from "@joculdemocratiei/utils";
import { candidates, DEBATE_COUNTDOWN_TIME } from "@joculdemocratiei/utils";

import { useRoomDebate, useRoomPlayers, useRoomState } from "@/contexts/room-context";
import { useRoomCountdown } from "@/hooks/use-room-countdown";
import { useAnswerSounds } from "@/hooks/use-answer-sounds";
import { usePlayerLeaveSounds } from "@/hooks/use-player-leave-sounds";
import { cn } from "@/utils/lib";
import { UserAvatar } from "./utils";

export function DebatePhase() {
  const { players } = useRoomPlayers();
  const { currentUserId, candidateId, state } = useRoomState();
  const { debateTopic, debateAnswers, playerAnswers, selectedAnswerId, handleSelectAnswer } =
    useRoomDebate();

  useAnswerSounds(playerAnswers || {}, currentUserId);
  usePlayerLeaveSounds(players, currentUserId);

  const countdownEndTime = state.context.countdownEndTime;
  const { countdown, progressPercentage } = useRoomCountdown({
    countdownEndTime,
    totalTimeMs: DEBATE_COUNTDOWN_TIME,
  });

  const candidate = candidates.find((candidate) => candidate.id === candidateId);
  const scrollAreaHeight = "calc(100dvh - 420px)";

  return (
    <Grid gap="4" p="4">
      <Flex gap="4" align="center" justify="center">
        <AnimatePresence>
          {players.map((player: GamePlayer) => {
            const isCurrentUser = player.playerId === currentUserId;
            const hasAnswered = playerAnswers?.[player.playerId];
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
                      hasAnswered && "ring-1 ring-green-9",
                    )}
                  >
                    <UserAvatar player={player} />
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
          {candidate?.name}
        </Badge>
        <Text size="2" weight="medium" color="gray">
          alege raspunsul potrivit:
        </Text>
      </Flex>
      <ScrollArea type="auto" scrollbars="vertical" size="1" style={{ height: scrollAreaHeight }}>
        <Box className="w-full">
          <RadioCards.Root value={selectedAnswerId} onValueChange={handleSelectAnswer}>
            <Grid gap="3" className="justify-items-stretch w-full">
              {debateAnswers[currentUserId!]?.map((answer: GameMessage) => (
                <RadioCards.Item
                  key={answer.id}
                  value={answer.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all w-full",
                    selectedAnswerId === answer.id
                      ? "border-accent-9 bg-accent-3"
                      : "border-gray-6 hover:border-accent-7 hover:bg-accent-2",
                  )}
                >
                  <div className="w-full">
                    <Text size="3" weight="medium" style={{ textAlign: "left" }}>
                      {answer.text}
                    </Text>
                  </div>
                </RadioCards.Item>
              ))}
            </Grid>
          </RadioCards.Root>
        </Box>
      </ScrollArea>
    </Grid>
  );
}
