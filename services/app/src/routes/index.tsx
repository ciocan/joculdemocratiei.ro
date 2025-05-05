import { createFileRoute, Link } from "@tanstack/react-router";
import { Heading, Button, Flex, Grid, Card, Text, Avatar } from "@radix-ui/themes";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";

import { shuffledCandidates, getCandidateAvatarUrl } from "@joculdemocratiei/utils";
import { useThemeStore } from "@/stores/theme-store";

import { useUserStore } from "@/stores/user-store";
import { TextAnimate } from "@/components/animations/text-animate";
import { GameStats } from "@/components/game-stats";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const user = useUserStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startAngleRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) {
      return;
    }
    draggingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    startAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX) - rotation;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    setRotation(currentAngle - startAngleRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Silently ignore if releasePointerCapture fails
    }
  };

  return (
    <Grid className="m-4">
      <Card>
        <Grid gap="4" align="center" p="2">
          <div className="relative h-[280px] sm:h-[320px] md:h-[360px]">
            <AnimatePresence>
              <motion.div
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Heading as="h1" size="6" className="text-center drop-shadow-md">
                  <TextAnimate
                    className="text-accent-9 text-xl sm:text-3xl"
                    text="Jocul Democrației"
                    type="popIn"
                    delay={0.6}
                    duration={0.8}
                  />
                </Heading>
                <Heading as="h2" size="4" className="text-center drop-shadow-md">
                  <TextAnimate
                    className="text-gray-400 text-base sm:text-xl"
                    text="Votul meu contează"
                    type="calmInUp"
                    delay={0.8}
                    duration={0.8}
                  />
                </Heading>
              </motion.div>
            </AnimatePresence>
            <motion.div
              ref={containerRef}
              className="absolute left-0 top-0 h-full w-full cursor-grab"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ touchAction: "none" }}
            >
              {shuffledCandidates.map((candidate, index) => {
                const totalCandidates = shuffledCandidates.length;
                const angle = (index / totalCandidates) * 2 * Math.PI - Math.PI / 2 + rotation;
                const radius = 42;

                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                const delay = 0.05 + index * 0.08;

                const floatDuration = 3 + Math.random() * 2;
                const floatDistance = 5 + Math.random() * 5;
                const floatDelay = Math.random() * 2;

                return (
                  <motion.div
                    key={candidate.id}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: ["-50%", "-50%"],
                      y: ["-50%", "-50%"],
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: delay,
                      mass: 0.8,
                    }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -floatDistance, 0],
                        x: [0, floatDistance / 2, 0],
                      }}
                      transition={{
                        duration: floatDuration,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: floatDelay,
                      }}
                    >
                      <Avatar
                        size={{ initial: "4", xs: "5", md: "6" }}
                        src={getCandidateAvatarUrl(candidate.id, theme)}
                        radius="full"
                        fallback={candidate.name.substring(0, 2)}
                        className="border-2 border-accent-5 hover:border-accent-9 transition-all hover:scale-110 cursor-pointer shadow-md overflow-hidden"
                        title={`${candidate.name} - ${candidate.party}`}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          <Grid gap="6" className="max-w-2xl mx-auto w-full">
            <Card variant="surface" className="text-center py-6">
              <Grid gap="4">
                <Heading size="5" className="text-accent-11">
                  <span className="text-4xl mr-3">🎩</span>Jocul Democrației
                </Heading>
                <Text size="4" className="text-accent-9 font-bold mb-2">
                  Singurul joc unde câștigi puncte pentru că ai avut tupeul să fii de acord cu
                  dușmanul politic!
                </Text>
                <Text size="3" className="text-gray-11">
                  Ai visat vreodată să fii politician, dar fără dosar penal și fără riscul de a
                  ajunge la DNA? Vrei să testezi cum ar fi să faci politică folosind chiar mesajele
                  reale ale candidaților preferați (sau detestați)? Acum ai ocazia!
                </Text>
              </Grid>
            </Card>

            <Card variant="surface" className="border-l-1 border-l-accent-9">
              <Grid gap="4">
                <Heading size="4" className="mb-4 text-accent-10">
                  Cum funcționează
                </Heading>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-xl">🛋️</span>
                    <Text size="3">
                      Intră în lobby și alege-ți candidatul preferat. Sau cel pe care îl urăști cel
                      cel mai puțin.
                    </Text>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">🎤</span>
                    <Text size="3">
                      Primești mesaje 100% reale, exact ce-au scos politicienii pe gură în campanie
                      (pe bune, nu inventate!) și alegi cel mai bun mesaj.
                    </Text>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">🗳️</span>
                    <Text size="3">
                      Votează mesajele celorlalți - fii sincer sau strategic. Cu cât ești mai
                      surprinzător, cu atât mai bine!
                    </Text>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">📊</span>
                    <Text size="3">
                      Vezi rezultatele și observă cine câștigă: populismul, cinismul sau rațiunea
                      (glumim, e mereu populismul).
                    </Text>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">🤖</span>
                    <Text size="3">
                      Nu ai destui prieteni online? Nicio problemă! Roboțeii digitali vor completa
                      jocul, fiecare cu personalitatea lui unică și preferințe politice aleatorii.
                      Îi vei recunoaște după numele lor futuristice.
                    </Text>
                  </li>
                </ul>
              </Grid>
            </Card>

            <Card variant="surface" className="">
              <Grid gap="4">
                <Heading size="3" className="text-accent-9">
                  <span className="text-xl mr-2">👥</span>Jocul e multiplayer în timp real, deci
                  poți dezbate simultan cu până la 6 prieteni sau dușmani - dacă încă mai ai
                  prieteni după ultimele alegeri. Iar dacă nu, avem roboței care te vor însoți în
                  dezbatere, cu nume creative precum "Roboțelu Ciberneticu" sau "Bionic Bianca".
                </Heading>
              </Grid>
            </Card>

            <Card variant="surface" className="border-l-1 border-l-accent-9">
              <Grid gap="4">
                <Heading size="4" className="mb-2 flex items-center gap-2">
                  <span>🧠</span>Algoritmul scorului „Bridge-Empathy”
                </Heading>
                <ul className="space-y-2">
                  <li>
                    <span className="mr-2">❤️</span>Primești puncte când alții îți aprobă mesajul.
                    Bonus dacă îi convingi chiar și pe adversarii politici să dea "like".
                  </li>
                  <li>
                    <span className="mr-2">🔥</span>Cu cât ideologia adversarului e mai departe de
                    tine, cu atât primești mai multe puncte.
                  </li>
                  <li>
                    <span className="mr-2">⚡</span>Atenție la mesajele riscante! Pot câștiga multe
                    puncte, dar pot fi și biletul tău direct spre proteste în Piața Victoriei
                    (virtuale, stai chill).
                  </li>
                </ul>
              </Grid>
            </Card>

            <Card variant="surface">
              <Text size="3" className="flex flex-col gap-2">
                <span className="text-gray-10">
                  <span className="font-bold text-accent-10">Atenție:</span> Jocul poate produce
                  efecte secundare precum: înțelegerea punctului de vedere advers, recunoașterea că
                  adevărul e undeva la mijloc și, în cazuri rare, renunțarea la comentarii agresive
                  pe Facebook. Iar roboțeii pot fi mai raționali decât utilizatorii reali, ceea ce e
                  puțin trist, dar foarte amuzant.
                </span>
                <span className="italic text-accent-9">
                  Jocul Democrației:{" "}
                  <span className="text-gray-10">
                    educație civică serioasă, ambalată în sarcasm și ironie – pentru că politica
                    românească merită tratată exact așa cum e.
                  </span>
                </span>
              </Text>
            </Card>
          </Grid>

          <Card variant="surface">
            <Grid>
              <GameStats className="justify-self-center" withDetails />
            </Grid>
          </Card>

          <Flex gap="4" align="center" direction="column">
            {user?.userId ? (
              <>
                <Button
                  size="3"
                  asChild
                  style={{ width: "100%", maxWidth: "56rem" }}
                  className="mb-2"
                >
                  <Link to="/joc-nou">Joc nou</Link>
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  asChild
                  style={{ width: "100%", maxWidth: "56rem" }}
                >
                  <Link to="/u/$userId" params={{ userId: user.userId }}>
                    Profilul meu
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="3" asChild style={{ width: "100%", maxWidth: "56rem" }}>
                <Link to="/incepe">Incepe jocul</Link>
              </Button>
            )}
          </Flex>
        </Grid>
      </Card>
      <Footer />
    </Grid>
  );
}
