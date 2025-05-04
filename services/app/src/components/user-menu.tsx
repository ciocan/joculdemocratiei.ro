import { Flex, IconButton, DropdownMenu, Avatar, Slider, Switch } from "@radix-ui/themes";
import {
  ExitIcon,
  HomeIcon,
  PersonIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
} from "@radix-ui/react-icons";
import { PaletteIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { getCandidateAvatarUrl } from "@joculdemocratiei/utils";
import { useUserStore } from "@/stores/user-store";
import { gameStore } from "@/stores/game-store";
import { useThemeStore } from "@/stores/theme-store";
import { useSoundSettings } from "@/contexts/sound-context";
import { useLeaveRoomSound } from "@/hooks/use-leave-room-sound";

export function UserMenu({ handleLeaveRoom }: { handleLeaveRoom?: () => void }) {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const gameState = gameStore.get();
  const candidateId = gameState.context.candidateId;
  const { theme, toggleTheme } = useThemeStore();
  const { isMuted, volume, setVolume, setMuted } = useSoundSettings();
  const { handleLeaveRoomWithSound } = useLeaveRoomSound(handleLeaveRoom);

  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";
  const userName = user ? `${user.firstName} ${user.lastName}` : "Utilizator";
  const candidateImage = candidateId ? getCandidateAvatarUrl(candidateId, theme) : undefined;

  const navigateToHome = () => {
    handleLeaveRoomWithSound();
    navigate({ to: "/" });
  };

  const navigateToProfile = () => {
    if (user?.userId) {
      handleLeaveRoomWithSound();
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
        <DropdownMenu.Item onClick={toggleTheme}>
          {theme === "amber" ? (
            <PaletteIcon className="text-blue-9 size-4" />
          ) : (
            <PaletteIcon className="text-amber-9 size-4" />
          )}
          <span className="ml-2">
            Schimbă culoare:{" "}
            {theme === "amber" ? (
              <span className="text-blue-9">Albastru</span>
            ) : (
              <span className="text-amber-9">Auriu</span>
            )}
          </span>
        </DropdownMenu.Item>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            {isMuted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
            <span className="ml-2">Setări sunet</span>
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <Flex direction="column" gap="2" p="2">
              <Flex align="center" justify="between" gap="2">
                <span>Sunet:</span>
                <Switch checked={!isMuted} onCheckedChange={(checked) => setMuted(!checked)} />
              </Flex>
              <Flex direction="column" gap="1">
                <span>Volum:</span>
                <Slider
                  defaultValue={[volume]}
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(newValue) => setVolume(newValue[0])}
                  disabled={isMuted}
                />
              </Flex>
            </Flex>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Separator />
        {handleLeaveRoom && (
          <DropdownMenu.Item color="red" onClick={handleLeaveRoomWithSound}>
            <ExitIcon />
            <span className="ml-2">Părăsește camera</span>
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
