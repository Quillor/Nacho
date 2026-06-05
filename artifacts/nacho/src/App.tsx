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
  Show,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@workspace/pico-ui/toaster";
import { TooltipProvider } from "@workspace/pico-ui/tooltip";
import { DEV_AUTH_BYPASS } from "@/lib/dev-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Studio from "@/pages/studio";
import LibraryPage from "@/pages/library";
import Editor from "@/pages/editor";
import PublicView from "@/pages/public-view";
import SettingsPage from "@/pages/settings";
import Terms from "@/pages/terms";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/studio`}
      />
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
        forceRedirectUrl={`${basePath}/studio`}
      />
    </div>
  );
}

// Public landing for signed-out users; signed-in users go straight to the studio.
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/studio" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

// Gate an app page behind authentication; signed-out visitors go to sign-in.
// In a dev build with the bypass flag on, render the page directly so gated
// pages can be tested without signing in (see lib/dev-auth.ts).
function Protected({ children }: { children: React.ReactNode }) {
  if (DEV_AUTH_BYPASS) return <>{children}</>;
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

// Keeps the webview fresh when the signed-in user changes by clearing caches.
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
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/v/:shareId" component={PublicView} />
      <Route path="/terms" component={Terms} />
      <Route path="/studio">
        <Protected>
          <Studio />
        </Protected>
      </Route>
      <Route path="/library">
        <Protected>
          <LibraryPage />
        </Protected>
      </Route>
      <Route path="/editor/:id">
        <Protected>
          <Editor />
        </Protected>
      </Route>
      <Route path="/settings">
        <Protected>
          <SettingsPage />
        </Protected>
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
            title: "Welcome back",
            subtitle: "Sign in to start recording",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start sending videos in seconds",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
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
