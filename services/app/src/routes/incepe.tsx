import { createFileRoute } from "@tanstack/react-router";
import { Heading, Text, Container, Grid } from "@radix-ui/themes";

import { NewUser } from "@/components/new-user";

export const Route = createFileRoute("/incepe")({
  component: Incepe,
});

function Incepe() {
  return (
    <Grid height="100%">
      <Container size="1" pt="2" px="4" mt="auto">
        <Heading as="h1" size="7" mb="4">
          Creaza-ti contul
        </Heading>
        <Text as="p" size="4">
          Alege-ti un nume de utilizator.
        </Text>
        <Text as="p" size="4" color="gray">
          Contul tau generat aleatoriu, anonim si nu poate fi editat odata creat.
        </Text>
      </Container>
      <NewUser />
    </Grid>
  );
}
