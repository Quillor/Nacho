import { useEffect, useState } from "react";
import { User, Mail, Lock, Check } from "lucide-react";
import { useUser } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";

function errMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "errors" in err &&
    Array.isArray((err as { errors?: unknown[] }).errors)
  ) {
    const first = (err as { errors: Array<{ message?: string }> }).errors[0];
    if (first?.message) return first.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const cardClass = "rounded-none border-4 border-foreground bg-card p-6 shadow-none";
const headingClass = "font-display text-xl font-black uppercase";
const inputClass = "border-2 border-foreground bg-background";
const labelClass = "mb-1.5 block font-bold uppercase tracking-wide text-sm";

export function getDisplayName(unsafeMetadata: unknown): string {
  if (
    unsafeMetadata &&
    typeof unsafeMetadata === "object" &&
    "displayName" in unsafeMetadata
  ) {
    const value = (unsafeMetadata as { displayName?: unknown }).displayName;
    if (typeof value === "string") return value;
  }
  return "";
}

function ProfileNameCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const savedName = getDisplayName(user?.unsafeMetadata);

  useEffect(() => {
    if (user) setDisplayName(savedName);
  }, [user, savedName]);

  const dirty = !!user && displayName.trim() !== savedName;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          displayName: displayName.trim(),
        },
      });
      toast({ title: "Name updated" });
    } catch (err) {
      toast({
        title: "Couldn't update name",
        description: errMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <User className="h-5 w-5" />
        <h2 className={headingClass}>Profile</h2>
      </div>
      <div>
        <Label htmlFor="displayName" className={labelClass}>
          Display name
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Doe"
          className={inputClass}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Shown in the app instead of your email.
        </p>
      </div>
      <Button
        disabled={!dirty || saving}
        onClick={() => void save()}
        className="mt-6 border-2 border-foreground bg-primary font-bold uppercase text-primary-foreground hover:bg-primary/90"
      >
        <Check className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save name"}
      </Button>
    </Card>
  );
}

function EmailCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentEmail = user?.primaryEmailAddress?.emailAddress;

  const reset = () => {
    setOpen(false);
    setNewEmail("");
    setCode("");
    setPendingEmailId(null);
  };

  const sendCode = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const created = await user.createEmailAddress({ email: newEmail.trim() });
      await created.prepareVerification({ strategy: "email_code" });
      setPendingEmailId(created.id);
      toast({
        title: "Verification sent",
        description: `Enter the code we sent to ${newEmail.trim()}.`,
      });
    } catch (err) {
      toast({
        title: "Couldn't start email change",
        description: errMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!user || !pendingEmailId) return;
    setBusy(true);
    try {
      const emailObj = user.emailAddresses.find(
        (e) => e.id === pendingEmailId,
      );
      if (!emailObj) throw new Error("Email no longer pending.");
      await emailObj.attemptVerification({ code: code.trim() });
      await user.update({ primaryEmailAddressId: emailObj.id });
      const previous = user.emailAddresses.filter((e) => e.id !== emailObj.id);
      await Promise.all(previous.map((e) => e.destroy()));
      await user.reload();
      toast({ title: "Email updated" });
      reset();
    } catch (err) {
      toast({
        title: "Couldn't verify email",
        description: errMessage(err, "Check the code and try again."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <h2 className={headingClass}>Email</h2>
      </div>
      <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-foreground pb-3">
        <span className="font-medium text-muted-foreground">Current email</span>
        <span className="truncate font-bold" title={currentEmail ?? ""}>
          {currentEmail ?? "…"}
        </span>
      </div>

      {!open && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-6 border-2 border-foreground font-bold uppercase"
        >
          Change email
        </Button>
      )}

      {open && !pendingEmailId && (
        <div className="mt-6">
          <Label htmlFor="newEmail" className={labelClass}>
            New email
          </Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
          <div className="mt-4 flex gap-2">
            <Button
              disabled={busy || !newEmail.trim()}
              onClick={() => void sendCode()}
              className="border-2 border-foreground bg-primary font-bold uppercase text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Sending…" : "Send code"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={reset}
              className="border-2 border-foreground font-bold uppercase"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {open && pendingEmailId && (
        <div className="mt-6">
          <Label htmlFor="emailCode" className={labelClass}>
            Verification code
          </Label>
          <Input
            id="emailCode"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className={inputClass}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a code to {newEmail.trim()}.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              disabled={busy || !code.trim()}
              onClick={() => void confirmCode()}
              className="border-2 border-foreground bg-primary font-bold uppercase text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Verifying…" : "Verify & save"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={reset}
              className="border-2 border-foreground font-bold uppercase"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PasswordCard() {
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
        className="mt-6 border-2 border-foreground bg-primary font-bold uppercase text-primary-foreground hover:bg-primary/90"
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

export function AccountManagement() {
  return (
    <div className="space-y-6">
      <ProfileNameCard />
      <EmailCard />
      <PasswordCard />
    </div>
  );
}
