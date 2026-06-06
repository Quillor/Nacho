import { useState } from "react";
import { Mail } from "lucide-react";
import { useUser } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { cardClass, errMessage, headingClass, inputClass, labelClass } from "../account";

/**
 * Change the primary email: add a new address, verify it with an email code,
 * promote it to primary, then remove the previous addresses.
 */
export function EmailCard() {
  const { user, isLoaded } = useUser();
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
      <div className="flex items-center justify-between gap-4 border-b border-dashed border-foreground pb-3">
        <span className="font-medium text-muted-foreground">Current email</span>
        {isLoaded ? (
          <span className="truncate font-bold" title={currentEmail ?? ""}>
            {currentEmail ?? "—"}
          </span>
        ) : (
          <Skeleton className="h-5 w-40" />
        )}
      </div>

      {!open && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-6 border border-foreground font-bold"
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
              className="border border-foreground bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {busy ? "Sending…" : "Send code"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={reset}
              className="border border-foreground font-bold"
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
              className="border border-foreground bg-accent font-bold text-accent-foreground hover:bg-accent/90"
            >
              {busy ? "Verifying…" : "Verify & save"}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={reset}
              className="border border-foreground font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
