import { createFileRoute } from "@tanstack/react-router";
import { Grid, Card, Heading, Text, Button, Flex, Container } from "@radix-ui/themes";
import { AnimatePresence } from "motion/react";

import { ProtectedRoute } from "@/components/protected-route";
import { Loading } from "@/components/loading";
import { RoomProviderWithParams, useRoomState, useRoomActions } from "@/contexts/room-context";
import { LobbyPhase, DebatePhase, VotingPhase, ResultsPhase, RoomHeader } from "@/components/room";
import { usePhaseSounds } from "@/hooks/use-phase-sounds";

export const Route = createFileRoute("/j/$roomId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RoomProviderWithParams>
      <RoomContent />
    </RoomProviderWithParams>
  );
}

function RoomHeaderWithContext() {
  const { players, isPrivate, state } = useRoomState();
  const { handleLeaveRoom } = useRoomActions();

  const debateTopic = state.context.roundsData[state.context.currentRound]?.debateTopic;

  return (
    <RoomHeader
      players={players}
      isPrivate={isPrivate}
      phase={state.context.phase}
      currentRound={state.context.currentRound}
      totalRounds={state.context.totalRounds}
      debateTopic={debateTopic}
      showShareButtons={state.context.phase === "lobby"}
      handleLeaveRoom={handleLeaveRoom}
    />
  );
}

function RoomContent() {
  const { state, isLoading, wsUrl } = useRoomState();
  const { handleNewGame } = useRoomActions();
  // Use the phase sounds hook to play sounds on phase transitions
  usePhaseSounds(state.context.phase);

  const renderPhaseComponent = () => {
    switch (state.context.phase) {
      case "lobby":
        return <LobbyPhase key="lobby" />;
      case "debate":
        return <DebatePhase key="debate" />;
      case "voting":
        return <VotingPhase key="voting" />;
      case "results":
        return <ResultsPhase key="results" />;
      default:
        return <LobbyPhase key="lobby" />;
    }
  };

  return (
    <ProtectedRoute>
      <Container className="h-full max-w-full">
        {isLoading ? (
          <Flex align="center" justify="center" className="h-screen">
            <Loading />
          </Flex>
        ) : wsUrl && state.context.candidateId ? (
          <div className="flex flex-col">
            <RoomHeaderWithContext />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AnimatePresence mode="wait">{renderPhaseComponent()}</AnimatePresence>
            </div>
          </div>
        ) : (
          <Flex align="center" justify="center" className="h-[calc(100dvh-200px)]">
            <Card>
              <Grid columns="1" gap="4" align="center" p="4">
                <Heading size="6" align="center">
                  Nu poți participa la această cameră
                </Heading>
                <Text align="center" color="gray">
                  Camera nu există sau nu ai permisiunea să te conectezi.
                </Text>
                <Button onClick={handleNewGame} size="3">
                  Începe joc nou
                </Button>
              </Grid>
            </Card>
          </Flex>
        )}
      </Container>
    </ProtectedRoute>
  );
}
