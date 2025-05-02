import { Heading, Grid, Spinner } from "@radix-ui/themes";

export function Loading() {
  return (
    <Grid p="4" gap="1" minHeight="380px" justify="center" align="center">
      <Heading
        as="h2"
        size="3"
        align="center"
        color="gray"
        className="flex flex-col place-self-center items-center gap-2"
      >
        <Spinner size="3" />
        <span>Se incarca ...</span>
      </Heading>
    </Grid>
  );
}
