import {
  Flex,
  IconButton,
  DropdownMenu,
  Avatar,
  Slider,
  Switch,
  Dialog,
  TextField,
  Button,
} from "@radix-ui/themes";
import {
  ExitIcon,
  HomeIcon,
  PersonIcon,
  SpeakerLoudIcon,
  SpeakerOffIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  ClipboardCopyIcon,
  EnterIcon,
} from "@radix-ui/react-icons";
import { PaletteIcon, KeyRoundIcon } from "lucide-react";

import { useUserMenu } from "@/hooks/use-user-menu";

export function UserMenu({ handleLeaveRoom }: { handleLeaveRoom?: () => void }) {
  const {
    user,
    userInitials,
    userName,
    candidateImage,
    theme,
    toggleTheme,
    isMuted,
    volume,
    setVolume,
    setMuted,
    showSecretKey,
    importDialogOpen,
    secretKeyInput,
    importError,
    isImporting,
    navigateToHome,
    navigateToProfile,
    toggleSecretKeyVisibility,
    copySecretKeyToClipboard,
    handleImportUserProfile,
    setImportDialogOpen,
    setSecretKeyInput,
    handleLeaveRoomWithSound,
  } = useUserMenu(handleLeaveRoom);

  return (
    <>
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

          {user?.secretKey && (
            <Flex direction="column" p="2" gap="1" className="border-b border-accent-6">
              <Flex align="center" justify="between">
                <span className="text-xs font-medium">Cheie secretă:</span>
                <IconButton size="1" variant="ghost" onClick={toggleSecretKeyVisibility}>
                  {showSecretKey ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </IconButton>
              </Flex>
              <Flex align="center" gap="1">
                <span className="text-xs font-mono bg-accent-3 p-1 rounded flex-1 overflow-hidden">
                  {showSecretKey ? user.secretKey : "••••••••••••••••••••••••••••••••"}
                </span>
                <IconButton size="1" variant="ghost" onClick={copySecretKeyToClipboard}>
                  <ClipboardCopyIcon />
                </IconButton>
              </Flex>
            </Flex>
          )}

          <DropdownMenu.Item onClick={navigateToProfile}>
            <PersonIcon />
            <span className="ml-2">Profilul meu</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={navigateToHome}>
            <HomeIcon />
            <span className="ml-2">Pagina principală</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => setImportDialogOpen(true)}>
            <EnterIcon />
            <span className="ml-2">Importă profil</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
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
                  <Switch
                    checked={!isMuted}
                    onCheckedChange={(checked) => {
                      setMuted(!checked);
                    }}
                  />
                </Flex>
                <Flex direction="column" gap="1">
                  <span>Volum:</span>
                  <Slider
                    defaultValue={[volume]}
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(newValue) => {
                      setVolume(newValue[0]);
                    }}
                    disabled={isMuted}
                  />
                </Flex>
              </Flex>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          {handleLeaveRoom && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onClick={handleLeaveRoomWithSound}>
                <ExitIcon />
                <span className="ml-2">Părăsește camera</span>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Dialog.Root open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <Dialog.Content>
          <Dialog.Title>Importă profil utilizator</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Introdu cheia secretă a profilului pe care dorești să-l imporți.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Cheie secretă"
              value={secretKeyInput}
              type="password"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSecretKeyInput(e.target.value)
              }
            >
              <TextField.Slot>
                <KeyRoundIcon className="size-4" />
              </TextField.Slot>
            </TextField.Root>

            {importError && <div className="text-red-500 text-sm">{importError}</div>}

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Anulează
                </Button>
              </Dialog.Close>
              <Button onClick={handleImportUserProfile} disabled={isImporting}>
                {isImporting ? "Se importă..." : "Importă"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
