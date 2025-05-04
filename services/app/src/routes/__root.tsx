import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Grid, Theme, ThemePanel } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { seo } from "@/utils/seo";
import { GameProvider } from "@/contexts/game-context";
import { useThemeStore } from "@/stores/theme-store";
import { SoundProvider } from "@/contexts/sound-context";

import appCss from "@/styles/app.css?url";
import { AnonProvider } from "@/contexts/anon-provider";

const queryClient = new QueryClient();

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
      ...seo({
        title: "Jocul Democratiei | votul meu conteaza",
        description:
          "Jocul Democratiei este un joc online care te invata sa votezi si sa intelegi principiile democraciei.",
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "192x192",
        href: "/icons/icon-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "48x48",
        href: "/icons/icon-48x48.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <html lang="ro">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AnonProvider>
            <SoundProvider>
              <GameProvider>
                <Theme appearance="dark" accentColor={theme} grayColor="olive" radius="full">
                  <Grid
                    align="center"
                    justify="center"
                    maxWidth="600px"
                    minHeight="100dvh"
                    className="text-center mx-auto"
                  >
                    {children}
                  </Grid>
                  <Toaster position="top-center" richColors theme="dark" />
                  <ThemePanel defaultOpen={false} />
                </Theme>
                <TanStackRouterDevtools position="bottom-right" />
              </GameProvider>
            </SoundProvider>
          </AnonProvider>
          <Scripts />
        </QueryClientProvider>
      </body>
    </html>
  );
}
