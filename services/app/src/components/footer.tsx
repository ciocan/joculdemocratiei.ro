import { Flex, Card, Text, Link } from "@radix-ui/themes";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export function Footer() {
  return (
    <Card variant="surface" className="mt-4">
      <Flex gap="2" direction="column" align="center">
        <Text size="2" color="gray" align="center">
          Acest joc este anonim și nu colectează date personale identificabile.
        </Text>

        <Link
          href="https://github.com/ciocan/joculdemocratiei.ro"
          target="_blank"
          rel="noopener noreferrer"
          size="2"
        >
          <Flex gap="2" align="center">
            <Text>Proiect open source</Text>
            <GitHubLogoIcon className="size-4" />
          </Flex>
        </Link>
      </Flex>
    </Card>
  );
}
