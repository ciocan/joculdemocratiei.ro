import { Avatar } from "@radix-ui/themes";

import { type GamePlayer, isBot } from "@joculdemocratiei/utils";

import { cn } from "@/utils/lib";

export function UserAvatar({ player }: { player: GamePlayer }) {
  return (
    <Avatar
      size={{ initial: "1", xs: "3" }}
      className={cn("mx-auto", isBot(player.playerId) && "bg-green-10")}
      fallback={
        isBot(player.playerId) ? (
          <span className="text-2xl">🤖</span>
        ) : (
          player.name
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase())
            .join("")
        )
      }
    />
  );
}
