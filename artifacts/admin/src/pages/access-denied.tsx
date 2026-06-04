import { useClerk } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";

export default function AccessDenied() {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            This console is for Nacho administrators only. Your account does not have super-admin privileges.
          </p>
        </div>
        <Button onClick={() => signOut()} size="lg" className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
}
