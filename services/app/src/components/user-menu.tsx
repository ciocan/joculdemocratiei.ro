import { Flex, IconButton, DropdownMenu, Avatar } from "@radix-ui/themes";
import { ExitIcon, HomeIcon, PersonIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";

import { candidateAvatarUrl } from "@joculdemocratiei/utils";
import { useUserStore } from "@/stores/user-store";
import { gameStore } from "@/stores/game-store";

export function UserMenu({ handleLeaveRoom }: { handleLeaveRoom?: () => void }) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const gameState = gameStore.get();
  const candidateId = gameState.context.candidateId;

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";
  const userName = user ? `${user.firstName} ${user.lastName}` : "Utilizator";
  const candidateImage = candidateId
    ? candidateAvatarUrl[candidateId as keyof typeof candidateAvatarUrl]
    : undefined;

  const navigateToHome = () => {
    if (handleLeaveRoom) {
      handleLeaveRoom();
    }
    navigate({ to: "/" });
  };

  const navigateToProfile = () => {
    if (user?.userId) {
      if (handleLeaveRoom) {
        handleLeaveRoom();
      }
      navigate({ to: "/u/$userId", params: { userId: user.userId } });
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton size="3" variant="surface">
          <Avatar size="2" fallback={userInitials} radius="full" src={candidateImage} />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <Flex direction="row" p="2" gap="2" mb="2" className="border-b border-accent-6">
          <Avatar size="3" fallback={userInitials} radius="full" />
          <Flex direction="column">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-accent-9">
              {user?.city}, {user?.county}
            </span>
          </Flex>
        </Flex>
        <DropdownMenu.Item onClick={navigateToProfile}>
          <PersonIcon />
          <span className="ml-2">Profilul meu</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={navigateToHome}>
          <HomeIcon />
          <span className="ml-2">Pagina principală</span>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        {handleLeaveRoom && (
          <DropdownMenu.Item color="red" onClick={handleLeaveRoom}>
            <ExitIcon />
            <span className="ml-2">Părăsește camera</span>
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
