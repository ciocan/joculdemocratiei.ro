import { Heading, Card, Grid, Avatar, Badge, Button, Flex } from "@radix-ui/themes";

import { candidates } from "@joculdemocratiei/utils";

interface SelectedCandidateSummaryProps {
  candidateId: string;
  onContinue: () => void;
}

export function SelectedCandidateSummary({
  candidateId,
  onContinue,
}: SelectedCandidateSummaryProps) {
  const selectedCandidateData = candidates.find((c) => c.id === candidateId);

  if (!selectedCandidateData) {
    return null;
  }

  return (
    <Card variant="surface" className="bg-accent-2">
      <Grid gap="4" p="2">
        <Grid columns="auto 1fr" gap="3" align="center">
          <Grid justify="end" align="center">
            <Avatar
              size="4"
              src={selectedCandidateData.image}
              fallback={selectedCandidateData.name.substring(0, 2)}
              radius="full"
            />
          </Grid>
          <Flex gap="1" justify="between" align="center">
            <Heading size="4">{selectedCandidateData.name}</Heading>
            <Badge size="2" variant="soft">
              {selectedCandidateData.party}
            </Badge>
          </Flex>
        </Grid>
        <Button size="3" onClick={onContinue}>
          Continuă
        </Button>
      </Grid>
    </Card>
  );
}
