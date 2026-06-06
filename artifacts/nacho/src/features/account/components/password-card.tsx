import { useState } from "react";
import { Lock, Check } from "lucide-react";
import { useUser } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { cardClass, errMessage, headingClass, inputClass, labelClass } from "../account";

/**
 * Set or change the account password. When the user has no password yet
 * (e.g. signed in via OAuth) the current-password field is hidden.
 */
export function PasswordCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const hasPassword = user.passwordEnabled;

  const save = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Make sure both new password fields are identical.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      await user.updatePassword({
        newPassword,
        ...(hasPassword ? { currentPassword } : {}),
        signOutOfOtherSessions: true,
      });
      toast({ title: hasPassword ? "Password updated" : "Password set" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({
        title: "Couldn't update password",
        description: errMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5" />
        <h2 className={headingClass}>Password</h2>
      </div>
      {!hasPassword && (
        <p className="mb-4 text-sm text-muted-foreground">
          You signed in without a password. Set one to enable email + password
          sign-in.
        </p>
      )}
      <div className="space-y-4">
        {hasPassword && (
          <div>
            <Label htmlFor="currentPassword" className={labelClass}>
              Current password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        )}
        <div>
          <Label htmlFor="newPassword" className={labelClass}>
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword" className={labelClass}>
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <Button
        disabled={
          busy ||
          !newPassword ||
          !confirmPassword ||
          (hasPassword && !currentPassword)
        }
        onClick={() => void save()}
        className="mt-6 border border-foreground bg-accent font-bold text-accent-foreground hover:bg-accent/90"
      >
        <Check className="mr-2 h-4 w-4" />{" "}
        {busy
          ? "Saving…"
          : hasPassword
            ? "Update password"
            : "Set password"}
      </Button>
    </Card>
  );
}
