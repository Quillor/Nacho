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
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Studio from "@/pages/studio";
import LibraryPage from "@/pages/library";
import Editor from "@/pages/editor";
import PublicView from "@/pages/public-view";
import SettingsPage from "@/pages/settings";

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
    colorPrimary: "hsl(47 91% 53%)",
    colorForeground: "hsl(25 51% 12%)",
    colorMutedForeground: "hsl(25 40% 30%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(47 43% 94%)",
    colorInput: "hsl(47 43% 94%)",
    colorInputForeground: "hsl(25 51% 12%)",
    colorNeutral: "hsl(25 51% 12%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[hsl(47_43%_94%)] border-4 border-[hsl(25_51%_12%)] shadow-[8px_8px_0px_0px_hsl(25_51%_12%)] rounded-xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle:
      "text-[hsl(25_51%_12%)] font-display font-black uppercase tracking-tight text-2xl",
    headerSubtitle: "text-[hsl(25_40%_30%)] font-medium",
    socialButtonsBlockButtonText: "text-[hsl(25_51%_12%)] font-bold",
    formFieldLabel: "text-[hsl(25_51%_12%)] font-bold",
    footerActionLink:
      "text-[hsl(25_51%_12%)] font-bold underline hover:text-[hsl(47_91%_40%)]",
    footerActionText: "text-[hsl(25_40%_30%)]",
    dividerText: "text-[hsl(25_40%_30%)]",
    identityPreviewEditButton: "text-[hsl(25_51%_12%)]",
    formFieldSuccessText: "text-[hsl(25_51%_12%)]",
    alertText: "text-[hsl(25_51%_12%)]",
    logoBox: "h-10",
    logoImage: "h-10",
    socialButtonsBlockButton:
      "border-2 border-[hsl(25_51%_12%)] hover:bg-[hsl(47_30%_85%)]",
    formButtonPrimary:
      "bg-[hsl(47_91%_53%)] text-[hsl(25_51%_12%)] border-2 border-[hsl(25_51%_12%)] font-bold uppercase tracking-wide hover:bg-[hsl(47_91%_48%)]",
    formFieldInput: "border-2 border-[hsl(25_51%_12%)]",
    footerAction: "",
    dividerLine: "bg-[hsl(25_51%_12%)]",
    otpCodeFieldInput: "border-2 border-[hsl(25_51%_12%)]",
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
function Protected({ children }: { children: React.ReactNode }) {
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
