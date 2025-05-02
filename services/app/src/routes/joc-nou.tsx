import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Grid,
  Button,
  Card,
  Heading,
  Text,
  Dialog,
  Checkbox,
  Flex,
  IconButton,
  Strong,
} from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UserRoundPlusIcon, UsersIcon } from "lucide-react";

import { candidates } from "@joculdemocratiei/utils";

import { ProtectedRoute } from "@/components/protected-route";
import { CandidateSelection } from "@/components/candidate-selection";
import { SelectedCandidateSummary } from "@/components/selected-candidate-summary";
import { useUserStore } from "@/stores/user-store";
import { useGameRoom } from "@/hooks/use-game-room";
import { GameStats } from "@/components/game-stats";
import { UserMenu } from "@/components/user-menu";
import { ShareButtons } from "@/components/share";

export const Route = createFileRoute("/joc-nou")({
  component: RouteComponent,
});

function RoomInfoDialog({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <IconButton variant="ghost" size="2">
          <InfoCircledIcon className="size-6 text-accent-8" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title size="4" className="text-accent-11">
          {title}
        </Dialog.Title>
        <Dialog.Description>{children}</Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function RouteComponent() {
  const { user } = useUserStore();
  const {
    selectedCandidateId,
    showRoomOptions,
    isPrivate,
    isCreating,
    isJoining,
    handleContinue,
    handleCreateRoom,
    joinGameRoom,
    handleChangeCandidate,
    handleSetCandidateId,
    handleSetPrivateRoom,
  } = useGameRoom();

  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidateId);

  return (
    <ProtectedRoute>
      <Grid gap="4" p="4">
        {!showRoomOptions ? (
          <>
            <CandidateSelection
              selectedCandidate={selectedCandidateId}
              onSelectCandidate={handleSetCandidateId}
            />
            {selectedCandidateId && (
              <SelectedCandidateSummary
                candidateId={selectedCandidateId}
                onContinue={handleContinue}
              />
            )}
          </>
        ) : (
          <>
            <Card variant="surface">
              <Grid columns="2" align="center" justify="between">
                <GameStats />
                <Flex gap="2" className="place-self-end">
                  <ShareButtons />
                  <UserMenu />
                </Flex>
              </Grid>
            </Card>
            <Card variant="surface">
              <Grid gap="4" p="2" align="center" justify="center">
                <Heading size="4" align="center">
                  Alege tipul de joc
                </Heading>
                <Text className="text-center">
                  Candidatul ales:{" "}
                  <Strong className="text-accent-11">{selectedCandidateData?.name}</Strong>
                </Text>
                <Grid gap="4">
                  <Card>
                    <Grid gap="3" p="3">
                      <Flex align="center" justify="between">
                        <Heading size="3">Creează un joc nou</Heading>
                        <RoomInfoDialog title="Despre crearea unui joc nou">
                          <Text size="3">
                            Creează un joc nou și invită prietenii să se alăture. Poți face camera
                            privată pentru a permite doar invitaților să se alăture, sau publică
                            pentru a permite oricui să se alăture.
                          </Text>
                        </RoomInfoDialog>
                      </Flex>
                      <Flex gap="2" align="center">
                        <Checkbox
                          checked={isPrivate}
                          onCheckedChange={(checked) => handleSetPrivateRoom(checked as boolean)}
                          size="3"
                        />
                        <Text size="2">Cameră privată (doar invitați)</Text>
                      </Flex>
                      <Button
                        size="3"
                        onClick={handleCreateRoom}
                        disabled={isCreating}
                        loading={isCreating}
                      >
                        <UserRoundPlusIcon className="size-4" />
                        <Text size="2">Creează un joc</Text>
                      </Button>
                    </Grid>
                  </Card>
                  <Card>
                    <Grid gap="3" p="3">
                      <Flex align="center" justify="between">
                        <Heading size="3">Alătură-te unui joc</Heading>
                        <RoomInfoDialog title="Despre alăturarea la un joc">
                          <Text size="3">
                            Vei fi alocat aleator într-o cameră publică cu alți jucători.
                          </Text>
                        </RoomInfoDialog>
                      </Flex>
                      <Button
                        size="3"
                        onClick={joinGameRoom}
                        disabled={isJoining}
                        loading={isJoining}
                      >
                        <UsersIcon className="size-4" />
                        <Text size="2">Alătură-te unui joc</Text>
                      </Button>
                    </Grid>
                  </Card>
                  <Button size="3" variant="soft" onClick={handleChangeCandidate}>
                    Schimbă candidat
                  </Button>
                  <Button size="3" variant="soft" asChild>
                    <Link to="/u/$userId" params={{ userId: user?.userId ?? "" }}>
                      Profilul meu
                    </Link>
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </>
        )}
      </Grid>
    </ProtectedRoute>
  );
}
