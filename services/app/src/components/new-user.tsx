import { Suspense } from "react";
import { Heading, Button, Card, Grid, Skeleton, RadioCards, Flex, Spinner } from "@radix-ui/themes";
import { ThickArrowRightIcon } from "@radix-ui/react-icons";
import { AnimatePresence } from "motion/react";

import type { UserData } from "@joculdemocratiei/utils";
import { TextAnimate } from "@/components/animations/text-animate";
import { EMPTY_USER, TOTAL_PAGES, useNewUser } from "@/hooks/use-new-user";

function UserSkeletonPage() {
  return (
    <Grid width="auto" mt="2" p="4" gap="4">
      <Card variant="classic" className="h-fit">
        <Grid width="auto" gap="6" p="2">
          <Grid gap="1">
            {[0, 1, 2].map((i) => {
              return <UserCard key={i} user={EMPTY_USER} value={i.toString()} />;
            })}
          </Grid>
          <Button variant="surface" size="3" mt="auto" disabled>
            Schimba numele
          </Button>
        </Grid>
      </Card>
      <Button size="4" disabled>
        Mai departe <ThickArrowRightIcon className="size-6" />
      </Button>
    </Grid>
  );
}

function UserCard({ user, value }: { user: UserData; value: string }) {
  return (
    <RadioCards.Item value={value}>
      <Flex direction="column" width="100%" gap="1" minHeight="60px" justify="center">
        <AnimatePresence mode="wait">
          <Heading as="h1" size="4" align="center" key={`name-${user.firstName}-${user.lastName}`}>
            {user.firstName && user.lastName ? (
              <TextAnimate
                key={`${user.firstName}-${user.lastName}`}
                text={`${user.firstName} ${user.lastName}`}
                type="popIn"
                delay={0.5}
                duration={1}
              />
            ) : (
              <Skeleton height="24px" width="200px" className="place-self-center my-1" />
            )}
          </Heading>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <Heading
            as="h3"
            size="2"
            align="center"
            color="gray"
            className="font-normal!"
            key={`location-${user.city}-${user.county}`}
          >
            {user.city && user.county ? (
              <TextAnimate
                key={`${user.city}-${user.county}`}
                text={`${user.city}, ${user.county}`}
                type="popIn"
                delay={0.5}
                duration={1}
              />
            ) : (
              <Skeleton height="12px" width="150px" className="place-self-center my-1" />
            )}
          </Heading>
        </AnimatePresence>
      </Flex>
    </RadioCards.Item>
  );
}

export function NewUser() {
  const {
    currentPage,
    selectedUser,
    setSelectedUser,
    error,
    refetch,
    isFetching,
    isLoading,
    isCreatingUser,
    handleNameChange,
    handleNext,
    currentUsers,
  } = useNewUser();

  return (
    <Suspense fallback={<UserSkeletonPage />}>
      <Grid mt="2" p="4" gap="4">
        <Card variant="surface" className="h-fit min-h-[400px] place-content-center">
          {error ? (
            <Grid p="4" py="8" gap="4">
              <Heading as="h2" size="4" align="center" color="red">
                Eroare la încărcarea utilizatorilor
              </Heading>
              <Button size="3" variant="solid" color="red" onClick={() => refetch()}>
                Reîncarcă
              </Button>
            </Grid>
          ) : isLoading ? (
            <Grid p="4" gap="2">
              <Heading
                as="h2"
                size="3"
                align="center"
                color="gray"
                className="flex flex-col place-self-center items-center gap-2"
              >
                <Spinner size="3" />
                <span>se incarca ...</span>
              </Heading>
            </Grid>
          ) : (
            <Grid width="auto" gap="6" p="2" className="">
              <RadioCards.Root value={selectedUser} onValueChange={setSelectedUser} columns="1">
                {currentUsers.map((user: UserData, index: number) => {
                  return (
                    <UserCard
                      key={`user-${currentPage}-${index}`}
                      user={user}
                      value={index.toString()}
                    />
                  );
                })}
              </RadioCards.Root>
              <Button
                variant="surface"
                size="4"
                mt="auto"
                onClick={handleNameChange}
                disabled={isFetching || isCreatingUser}
                loading={isCreatingUser}
              >
                Schimba numele ({currentPage + 1}/{TOTAL_PAGES})
              </Button>
            </Grid>
          )}
        </Card>
        <Button size="4" onClick={handleNext} disabled={isFetching} className="place-self-end">
          Mai departe <ThickArrowRightIcon className="size-6" />
        </Button>
      </Grid>
    </Suspense>
  );
}
