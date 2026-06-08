import { useState } from "react";
import { Redirect } from "wouter";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Logo } from "@/components/logo";
import { useDesktopAuth } from "../desktop-auth";

// Desktop sign-in screen. Auth happens in the user's browser (production Clerk),
// then hands back to the app via the nacho:// deep link — so there's no Clerk UI
// embedded here, just a button that opens the browser and a waiting state.
export function DesktopSignIn() {
  const { isSignedIn, signIn } = useDesktopAuth();
  const [waiting, setWaiting] = useState(false);

  // Once the browser hands the token back and the provider flips to signed-in,
  // leave the sign-in screen for the studio.
  if (isSignedIn) return <Redirect to="/studio" />;

  const start = async () => {
    setWaiting(true);
    try {
      await signIn();
    } finally {
      // Stay in the waiting state; the provider flips to signed-in when the
      // browser hands the token back. Allow a retry after a while.
      setTimeout(() => setWaiting(false), 8000);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="w-[440px] max-w-full space-y-6 border-2 border-foreground bg-card p-8 shadow-md">
        <div className="flex justify-center">
          <Logo className="h-10" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Sign in to Nacho
          </h1>
          <p className="mt-2 font-medium text-muted-foreground">
            We'll open your browser to sign in securely, then bring you right
            back.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => void start()}
          disabled={waiting}
          className="h-14 w-full border-2 border-foreground bg-accent text-lg font-black uppercase tracking-wide text-accent-foreground shadow-md transition-all hover:translate-y-0.5 hover:shadow-sm disabled:opacity-70"
        >
          {waiting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Waiting for browser…
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Sign in with browser
            </>
          )}
        </Button>
        {waiting && (
          <p className="text-center text-sm font-medium text-muted-foreground">
            Finish signing in in your browser. If nothing happens,{" "}
            <button
              type="button"
              onClick={() => void start()}
              className="font-bold underline"
            >
              try again
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
