import {
  Grid,
  Card,
  Heading,
  Text,
  Button,
  Avatar,
  Badge,
  Dialog,
  Strong,
  Flex,
  Quote,
} from "@radix-ui/themes";
import { InfoCircledIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";

import { useRoomLobby, useRoomPlayers } from "@/contexts/room-context";
import { usePlayerSounds } from "@/hooks/use-player-sounds";
import { usePlayerLeaveSounds } from "@/hooks/use-player-leave-sounds";
import { UserAvatar } from "./utils";

function InstructionsDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant="outline" size="3">
          <InfoCircledIcon /> Instrucțiuni
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-w-[95vw] md:max-w-[500px]" aria-describedby={undefined}>
        <Dialog.Title size="4" className="text-accent-9 flex items-center gap-2">
          <InfoCircledIcon />
          Instrucțiuni
        </Dialog.Title>
        <Flex direction="column" gap="2" aria-label="Instrucțiuni">
          <Text color="gray">
            <Strong>Jocul Democrației</Strong> este un joc în care vei juca din perspectiva unui
            candidat la președinție și vei dezbate pe teme de interes național.
          </Text>
          <Flex direction="column" gap="2">
            <Text weight="bold" size="3">
              Pașii jocului:
            </Text>
            <ol className="list-decimal pl-5 space-y-2">
              <li className="text-sm">
                <Text>Așteaptă ca jucători să se conecteze (2-6 jucători).</Text>
              </li>
              <li className="text-sm">
                <Text>Când ești pregătit, apasă butonul "Sunt pregătit...".</Text>
              </li>
              <li className="text-sm">
                <Text>
                  Jocul va începe după 5 de secunde când cel putin jumatate din jucători sunt
                  pregătiți.
                </Text>
              </li>
              <li className="text-sm">
                <Text>Urmează instrucțiunile din joc pentru a completa activitățile.</Text>
              </li>
            </ol>
          </Flex>
          <Quote className="py-2 text-center">
            <Text size="3" className="text-accent-9">
              Nu toate opiniile sunt egale, dar fiecare vot contează
            </Text>
          </Quote>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function LobbyPhase() {
  const { players, currentUserId } = useRoomPlayers();
  const { isPrivate, countdown, isCurrentUserReady, handleReady } = useRoomLobby();
  usePlayerSounds(players, currentUserId);
  usePlayerLeaveSounds(players, currentUserId);

  return (
    <>
      <Card className="m-4 p-4">
        <Grid columns="2" gap="2">
          <Heading size="2" className="flex items-center gap-2">
            {isPrivate && <LockClosedIcon color="gray" />}
            Joc în așteptare
          </Heading>
          <Badge color="green" variant="soft" size="1" className="w-fit justify-self-end">
            Așteptând jucători
          </Badge>
          <Text size="2" color="gray" className="col-span-2">
            {isPrivate
              ? "Acest joc este privat. Doar jucătorii cu link de joc pot participa."
              : "Așteptăm alți jucători să se conecteze pentru a începe jocul."}
          </Text>
        </Grid>
      </Card>

      <div className="px-4">
        <Grid columns="3" gap="4" className="pb-4">
          <AnimatePresence mode="popLayout">
            {players.map((player) => (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.8,
                }}
                layout
                className="h-[140px]"
              >
                <Card
                  className={`p-2 h-full ${player.isReady ? "border-2 border-accent-9" : "bg-accent-5/30"}`}
                >
                  <Grid columns="1" gap="1" align="center" className="h-full">
                    <UserAvatar player={player} />
                    <Text weight="bold" size="1" align="center">
                      {player.name}
                    </Text>
                    <Badge
                      color={player.playerId === currentUserId ? "green" : "blue"}
                      variant="soft"
                      size="1"
                      className="mx-auto"
                    >
                      {player.playerId === currentUserId
                        ? player.isReady
                          ? "Pregătit"
                          : "Tu"
                        : player.isReady
                          ? "Pregătit"
                          : "Jucător"}
                    </Badge>
                  </Grid>
                </Card>
              </motion.div>
            ))}

            {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, index) => (
              <motion.div
                key={`empty-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.1,
                }}
                layout
                className="h-[140px]"
              >
                <Card className="p-2 h-full" variant="surface">
                  <Grid columns="1" gap="1" align="center" className="h-full">
                    <Avatar size="3" fallback="?" className="mx-auto" />
                    <Text size="1" align="center" color="gray">
                      ...
                    </Text>
                    <Text size="2" color="gray" align="center">
                      Loc liber
                    </Text>
                  </Grid>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Grid>
      </div>

      <Grid columns="2" align="center" gap="4" className="border-t border-accent-7 p-4">
        <InstructionsDialog />
        <Button
          size="3"
          disabled={players.length < 2 || isCurrentUserReady}
          color="blue"
          className="px-2"
          onClick={handleReady}
        >
          {countdown > 0 ? `Începe în ${countdown}s...` : "Sunt gata..."}
        </Button>
      </Grid>
    </>
  );
}
