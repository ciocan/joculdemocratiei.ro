import { Badge, Tooltip, Box, Grid } from "@radix-ui/themes";
import { UsersIcon, MessageSquareMore } from "lucide-react";
import { useGameStats } from "@/contexts/game-context";
import { cn } from "@/utils/lib";

export function GameStats({
  className,
  withDetails,
}: {
  className?: string;
  withDetails?: boolean;
}) {
  const { onlinePlayersCount, activeRoomsCount } = useGameStats();

  return (
    <Grid columns="2" gap="2" className={cn(className, "w-fit")}>
      <Tooltip content={`${onlinePlayersCount} jucători online în acest moment`}>
        <Badge variant="soft" color="green" size="2" className="flex items-center gap-1">
          <UsersIcon className="size-4" />
          {onlinePlayersCount}{" "}
          <Box
            as="span"
            display={{ initial: withDetails ? "inline-block" : "none", xs: "inline-block" }}
          >
            {onlinePlayersCount === 1 ? "jucător" : "jucători"} online
          </Box>
        </Badge>
      </Tooltip>
      <Tooltip content={`${activeRoomsCount} jocuri în desfășurare`}>
        <Badge variant="soft" size="2" className="flex items-center gap-1">
          <MessageSquareMore className="size-4" />
          {activeRoomsCount}{" "}
          <Box
            as="span"
            display={{ initial: withDetails ? "inline-block" : "none", xs: "inline-block" }}
          >
            {activeRoomsCount === 1 ? "joc" : "jocuri"} active
          </Box>
        </Badge>
      </Tooltip>
    </Grid>
  );
}
