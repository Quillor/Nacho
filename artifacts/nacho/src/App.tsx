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
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@workspace/pico-ui/toaster";
import { TooltipProvider } from "@workspace/pico-ui/tooltip";
import { isDevAuthBypassEnabled } from "@workspace/shared";
import { isDesktop } from "@/lib/desktop";
import {
  TestingModeBanner,
  DevModeToggle,
  isProfileComplete,
  useClerkAutocomplete,
} from "@/features/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Studio from "@/pages/studio";
import LibraryPage from "@/pages/library";
import Editor from "@/pages/editor";
import PublicView from "@/pages/public-view";
import SettingsPage from "@/pages/settings";
import Terms from "@/pages/terms";
import Shop from "@/pages/shop";
import Onboarding from "@/pages/onboarding";
import {
  ControlsOverlay,
  CameraOverlay,
  NotesOverlay,
} from "@/features/overlays";
import {
  DesktopAuthProvider,
  useDesktopAuth,
  DesktopSignIn,
  DesktopSettings,
} from "@/features/desktop-auth";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey =
  publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  ) || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Desktop builds with BASE_PATH=/ (so basePath is ""), served over the app://
// scheme with an SPA fallback; web keeps the Replit proxy path. Path-based
// routing is used in both, so Clerk and wouter never fight over the URL hash.
const routerBase = basePath;

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return routerBase && path.startsWith(routerBase)
    ? path.slice(routerBase.length) || "/"
    : path;
}

// The desktop app uses browser-handoff auth (not in-app Clerk), so it doesn't
// require a publishable key; the web build still does.
if (!clerkPubKey && !isDesktop) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: routerBase || "/",
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
      "bg-background border-2 border-foreground shadow-md rounded-md w-[440px] max-w-full overflow-hidden",
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
    resendCodeText: "text-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-foreground",
    formFieldSuccessText: "text-foreground",
    alertText: "text-foreground",
    logoBox: "h-10",
    logoImage: "h-10",
    socialButtonsBlockButton:
      "border border-foreground hover:bg-muted",
    // Background + text color are forced to the Pico accent in index.css (the
    // shadcn theme reassigns `--accent` inside the Clerk card, so utility
    // classes can't reach the brand yellow here). These classes own the border,
    // weight, and the chunky press animation that match the in-app brand button.
    formButtonPrimary:
      "!border-2 !border-foreground !font-bold uppercase tracking-wide !shadow-sm !py-2.5 transition-all hover:translate-y-[2px] hover:!shadow-xs active:translate-y-[2px] active:!shadow-none",
    formFieldInput: "border border-foreground",
    footerAction: "",
    dividerLine: "bg-foreground",
    otpCodeFieldInput: "border border-foreground",
  },
};

const signInRouting = {
  routing: "path" as const,
  path: `${routerBase}/sign-in`,
};
const signUpRouting = {
  routing: "path" as const,
  path: `${routerBase}/sign-up`,
};

function SignInPage() {
  useClerkAutocomplete("sign-in");
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <SignIn
        {...signInRouting}
        signUpUrl={`${routerBase}/sign-up`}
        forceRedirectUrl={`${routerBase}/studio`}
      />
      <DevModeToggle onEnabledPath="/studio" />
    </div>
  );
}

function SignUpPage() {
  useClerkAutocomplete("sign-up");
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        {...signUpRouting}
        signInUrl={`${routerBase}/sign-in`}
        forceRedirectUrl={`${routerBase}/studio`}
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

// Require a completed profile (first/last name + job title) before reaching the
// app. Redirects signed-in users with an incomplete profile to onboarding.
// Renders nothing until Clerk has loaded the user to avoid a redirect flash.
function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (user && !isProfileComplete(user.unsafeMetadata)) {
    return <Redirect to="/onboarding" />;
  }
  return <>{children}</>;
}

// Gate an app page behind authentication; signed-out visitors go to sign-in.
// In a dev build with the bypass flag on, render the page directly so gated
// pages can be tested without signing in (see lib/dev-auth.ts).
function Protected({ children }: { children: React.ReactNode }) {
  if (isDevAuthBypassEnabled()) return <>{children}</>;
  return (
    <>
      <Show when="signed-in">
        <ProfileGate>{children}</ProfileGate>
      </Show>
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
      {/* Desktop-only presenter overlays — loaded directly in their own
          content-protected windows; no auth gate, no AppShell. */}
      <Route path="/overlay/controls" component={ControlsOverlay} />
      <Route path="/overlay/camera" component={CameraOverlay} />
      <Route path="/overlay/notes" component={NotesOverlay} />
      <Route path="/terms" component={Terms} />
      <Route path="/shop" component={Shop} />
      <Route path="/onboarding" component={Onboarding} />
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

// Desktop auth gate (browser-handoff, no Clerk).
function DesktopProtected({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useDesktopAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

// Desktop routes: our own sign-in, the presenter overlays, and the authed app.
// No marketing/Clerk pages — sign-up/onboarding happen in the browser handoff.
function DesktopRoutes() {
  return (
    <Switch>
      <Route path="/sign-in" component={DesktopSignIn} />
      <Route path="/overlay/controls" component={ControlsOverlay} />
      <Route path="/overlay/camera" component={CameraOverlay} />
      <Route path="/overlay/notes" component={NotesOverlay} />
      <Route path="/studio">
        <DesktopProtected>
          <Studio />
        </DesktopProtected>
      </Route>
      <Route path="/library">
        <DesktopProtected>
          <LibraryPage />
        </DesktopProtected>
      </Route>
      <Route path="/editor/:id">
        <DesktopProtected>
          <Editor />
        </DesktopProtected>
      </Route>
      <Route path="/settings">
        <DesktopProtected>
          <DesktopSettings />
        </DesktopProtected>
      </Route>
      <Route>
        <Redirect to="/studio" />
      </Route>
    </Switch>
  );
}

// Desktop root: no ClerkProvider — uses the browser-handoff auth provider.
function DesktopApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DesktopAuthProvider>
          <DesktopRoutes />
        </DesktopAuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${routerBase}/sign-in`}
      signUpUrl={`${routerBase}/sign-up`}
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
          <TestingModeBanner />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  // Desktop: Clerk-free tree with browser-handoff auth. Web: full Clerk.
  // Both use path routing (desktop basePath is "" with a loopback SPA server).
  return (
    <WouterRouter base={basePath}>
      {isDesktop ? <DesktopApp /> : <ClerkProviderWithRoutes />}
    </WouterRouter>
  );
}

export default App;
