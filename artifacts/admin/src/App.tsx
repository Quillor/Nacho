import { useEffect, useRef } from "react";
import {
  Switch,
  Route,
  Redirect,
  useLocation,
  Router as WouterRouter,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@workspace/pico-ui/toaster";
import { TooltipProvider } from "@workspace/pico-ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppShell } from "@/components/app-shell";
import { TestingModeBanner } from "@/components/testing-mode-banner";
import { DevModeToggle } from "@/components/dev-mode-toggle";

import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import UserDetail from "@/pages/user-detail";
import Groups from "@/pages/groups";
import Notifications from "@/pages/notifications";
import Content from "@/pages/content";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorForeground: "hsl(var(--foreground))",
    colorMutedForeground: "hsl(var(--muted-foreground))",
    colorDanger: "hsl(var(--destructive))",
    colorBackground: "hsl(var(--background))",
    colorInput: "hsl(var(--background))",
    colorInputForeground: "hsl(var(--foreground))",
    colorNeutral: "hsl(var(--foreground))",
    fontFamily: "var(--app-font-sans)",
    borderRadius: "var(--radius)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-background border-4 border-foreground shadow-md rounded-md w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle:
      "text-foreground font-display font-extrabold tracking-tight text-2xl",
    headerSubtitle: "text-muted-foreground font-medium",
    socialButtonsBlockButtonText: "text-foreground font-bold",
    formFieldLabel: "text-foreground font-bold",
    footerActionLink:
      "text-foreground font-bold underline hover:text-foreground/70",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-foreground",
    formFieldSuccessText: "text-foreground",
    alertText: "text-foreground",
    logoBox: "h-10",
    logoImage: "h-10",
    socialButtonsBlockButton:
      "border-2 border-foreground hover:bg-muted",
    formButtonPrimary:
      "bg-primary text-primary-foreground border-2 border-foreground font-bold uppercase tracking-wide shadow-sm transition-all hover:bg-primary/90 hover:translate-y-[2px] hover:shadow-xs active:translate-y-[2px] active:shadow-none",
    formFieldInput: "border-2 border-foreground",
    footerAction: "",
    dividerLine: "bg-foreground",
    otpCodeFieldInput: "border-2 border-foreground",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/`}
      />
      <DevModeToggle onEnabledPath="/" />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      <Route path="/">
        <AppShell><Dashboard /></AppShell>
      </Route>
      <Route path="/users">
        <AppShell><Users /></AppShell>
      </Route>
      <Route path="/users/:userId">
        {(params) => (
          params.userId === "groups" ? (
            <AppShell><Groups /></AppShell>
          ) : (
            <AppShell><UserDetail userId={params.userId} /></AppShell>
          )
        )}
      </Route>
      <Route path="/groups">
        <AppShell><Groups /></AppShell>
      </Route>
      <Route path="/notifications">
        <AppShell><Notifications /></AppShell>
      </Route>
      <Route path="/content">
        <AppShell><Content /></AppShell>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Nacho Admin",
            subtitle: "Sign in to operator console",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <TestingModeBanner />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
