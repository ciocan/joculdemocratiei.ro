import {
  Heading,
  Text,
  Card,
  Grid,
  Avatar,
  Badge,
  ScrollArea,
  RadioCards,
  Callout,
} from "@radix-ui/themes";
import { CircleBackslashIcon } from "@radix-ui/react-icons";
import { AnimatePresence } from "motion/react";

import { candidates, getCandidateAvatarUrl } from "@joculdemocratiei/utils";
import { useThemeStore } from "@/stores/theme-store";

interface CandidateSelectionProps {
  selectedCandidate?: string;
  onSelectCandidate: (candidateId: string) => void;
}

const sortedCandidates = [...candidates].sort((a, b) => {
  if (a.isAvailable === b.isAvailable) {
    return Math.random() - 0.5;
  }
  return a.isAvailable ? -1 : 1;
});

export function CandidateSelection({
  selectedCandidate,
  onSelectCandidate,
}: CandidateSelectionProps) {
  const scrollAreaHeight = selectedCandidate ? "calc(100dvh - 320px)" : "calc(100dvh - 170px)";
  const { theme } = useThemeStore();

  return (
    <>
      <Card variant="surface" className="bg-accent-3">
        <Grid gap="2" p="4" py="0">
          <Heading size="6" align="center">
            Alege un candidat
          </Heading>
          <Text align="center" size="3" color="gray">
            Vei juca jocul din perspectiva si ideologia candidatului ales.
          </Text>
        </Grid>
      </Card>
      <ScrollArea type="always" scrollbars="vertical" size="1" style={{ height: scrollAreaHeight }}>
        <Grid gap="2" pb={selectedCandidate ? "0" : "4"}>
          <AnimatePresence mode="wait">
            <RadioCards.Root
              value={selectedCandidate || ""}
              onValueChange={onSelectCandidate}
              columns="1"
            >
              {sortedCandidates.map((candidate, index) => {
                const isFirstUnavailable =
                  !candidate.isAvailable &&
                  (index === 0 || sortedCandidates[index - 1].isAvailable);

                return (
                  <>
                    {isFirstUnavailable && (
                      <Callout.Root key="unavailable-callout">
                        <Grid gap="4" align="center" columns="auto 1fr auto" justify="between">
                          <CircleBackslashIcon className="size-6" />
                          <Callout.Text className="text-center" size={{ initial: "1", xs: "3" }}>
                            Momentan nu declarații disponibile pentru următorii candidați. Te rugăm
                            să alegi un alt candidat sau să încerci mai târziu.
                          </Callout.Text>
                          <CircleBackslashIcon className="size-6" />
                        </Grid>
                      </Callout.Root>
                    )}
                    <RadioCards.Item
                      key={candidate.id}
                      value={candidate.id}
                      disabled={!candidate.isAvailable}
                    >
                      <Grid columns="auto 1fr" gap="4" align="center" className="flex-1">
                        <Avatar
                          size={{ initial: "6", xs: "9" }}
                          src={getCandidateAvatarUrl(candidate.id, theme)}
                          radius="full"
                          fallback={candidate.name.substring(0, 2)}
                        />
                        <Grid gap="1">
                          <Heading size={{ initial: "4", xs: "7" }}>{candidate.name}</Heading>
                          <Text size={{ initial: "2", xs: "4" }}>{candidate.tagline}</Text>
                          <Badge size={{ initial: "1", xs: "3" }} variant="soft" className="w-fit">
                            {candidate.party}
                          </Badge>
                        </Grid>
                      </Grid>
                    </RadioCards.Item>
                  </>
                );
              })}
            </RadioCards.Root>
          </AnimatePresence>
        </Grid>
      </ScrollArea>
    </>
  );
}
