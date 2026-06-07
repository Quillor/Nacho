import { useState } from "react";
import { AlertTriangle, Mail, UserX } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Badge } from "@workspace/pico-ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/pico-ui/alert-dialog";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { getDisplayName, headingClass } from "../account";
import { ValueSkeleton } from "./settings-shared";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Permanently delete the Clerk account, guarded by a confirm dialog. */
export function DangerZoneCard() {
  const { toast } = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const accountEmail = user?.primaryEmailAddress?.emailAddress;
  const accountName =
    getDisplayName(user?.unsafeMetadata) ||
    user?.fullName ||
    user?.firstName ||
    accountEmail;

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await user.delete();
      setConfirmDelete(false);
      toast({ title: "Account deleted" });
      await signOut({ redirectUrl: basePath || "/" });
    } catch (err) {
      setDeleting(false);
      toast({
        title: "Couldn't delete account",
        description:
          err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-2 border-destructive bg-destructive/5 p-6 shadow-[6px_6px_0_0_hsl(var(--destructive))]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className={`${headingClass} text-destructive`}>Danger zone</h2>
        <Badge variant="destructive" className="ml-auto">
          Permanent
        </Badge>
      </div>
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-4 border-b border-dashed border-destructive/40 pb-2">
          <dt className="flex items-center gap-1 font-medium text-muted-foreground">
            <Mail className="h-4 w-4" /> Signed in as
          </dt>
          <dd className="truncate font-bold" title={accountEmail ?? ""}>
            {userLoaded ? (accountName ?? "—") : <ValueSkeleton className="w-32" />}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Permanently delete your Nacho account. This cannot be undone. Your
        locally stored recordings stay on this device, and published share links
        keep working.
      </p>
      <Button
        variant="destructive"
        disabled={!user || deleting}
        onClick={() => setConfirmDelete(true)}
        className="mt-6 w-full border-2 border-destructive bg-destructive font-bold text-destructive-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] transition-all hover:bg-destructive/90 hover:translate-y-[2px] hover:shadow-none"
      >
        <UserX className="mr-2 h-4 w-4" /> Delete my account
      </Button>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-2 border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your Nacho account
              {accountEmail ? ` (${accountEmail})` : ""}. This cannot be undone.
              Recordings stored on this device are not removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border border-foreground font-bold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteAccount();
              }}
              disabled={deleting}
              className="border border-foreground bg-destructive font-bold text-destructive-foreground"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
