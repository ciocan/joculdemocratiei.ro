import { Grid, Flex, Badge } from "@radix-ui/themes";
import { LockClosedIcon } from "@radix-ui/react-icons";

import type { GamePlayer } from "@joculdemocratiei/utils";

import { UserMenu } from "@/components/user-menu";
import { ShareButtons } from "@/components/share";
import { useRoomLeave } from "@/hooks/use-room-leave";

interface RoomHeaderProps {
  players: GamePlayer[];
  isPrivate: boolean;
  phase: string;
  currentRound?: number;
  totalRounds: number;
  debateTopic?: {
    topicId: string;
    topic: string;
    question: string;
  };
  showShareButtons?: boolean;
  handleLeaveRoom: () => void;
}

export function RoomHeader({
  players,
  isPrivate,
  phase,
  currentRound,
  totalRounds,
  debateTopic,
  showShareButtons = true,
  handleLeaveRoom,
}: RoomHeaderProps) {
  const { handleLeaveRoomWithCleanup } = useRoomLeave(handleLeaveRoom);
  return (
    <Grid columns="2" align="center" className="border-b border-accent-7 p-4">
      <Flex gap="2" align="center">
        {phase === "lobby" && (
          <Badge variant="soft" size="2">
            {players.length} / 6 jucători
          </Badge>
        )}
        {isPrivate && (
          <Badge variant="soft" size="2" className="flex items-center gap-1 text-accent-9">
            <LockClosedIcon />
            {phase === "lobby" && "Joc privat"}
          </Badge>
        )}
        {phase === "debate" && (
          <Badge color="blue" variant="soft" size="2">
            Dezbatere
          </Badge>
        )}
        {["debate", "voting", "results"].includes(phase) && (
          <Badge variant="soft" size="2">
            {debateTopic?.topic}
          </Badge>
        )}
        {phase === "voting" && (
          <Badge color="blue" variant="soft" size="2">
            Votare
          </Badge>
        )}
        {(phase === "debate" || phase === "voting" || phase === "results") &&
          currentRound !== undefined &&
          totalRounds !== undefined && (
            <Badge color="green" variant="soft" size="2">
              Runda {currentRound + 1} / {totalRounds}
            </Badge>
          )}
      </Flex>

      <Flex gap="2" justify="end">
        {showShareButtons && <ShareButtons />}
        <UserMenu handleLeaveRoom={handleLeaveRoomWithCleanup} />
      </Flex>
    </Grid>
  );
}
