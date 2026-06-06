import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { UserRoundCheck } from "lucide-react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { Logo } from "@/components/logo";
import { JobTitleCombobox } from "@/components/job-title-combobox";
import { getProfile, isProfileComplete } from "@/lib/profile";

const labelClass = "mb-1.5 block font-bold uppercase tracking-wide text-sm";
const inputClass = "h-11 border-2 border-foreground bg-background font-medium";

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

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill from any partial data already on the account.
  useEffect(() => {
    if (!user) return;
    const p = getProfile(user.unsafeMetadata);
    setFirstName((v) => v || p.firstName);
    setLastName((v) => v || p.lastName);
    setJobTitle((v) => v || p.jobTitle);
  }, [user]);

  // Already complete (or signed out) → leave the onboarding step.
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLocation("/sign-in", { replace: true });
      return;
    }
    if (isProfileComplete(user.unsafeMetadata)) {
      setLocation("/studio", { replace: true });
    }
  }, [isLoaded, user, setLocation]);

  const canSubmit =
    !!firstName.trim() && !!lastName.trim() && !!jobTitle.trim() && !saving;

  const submit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    try {
      const first = firstName.trim();
      const last = lastName.trim();
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          firstName: first,
          lastName: last,
          jobTitle: jobTitle.trim(),
          // Keep the existing display-name field in sync so the app shell and
          // settings show the full name immediately.
          displayName: `${first} ${last}`.trim(),
        },
      });
      setLocation("/studio", { replace: true });
    } catch (err) {
      setSaving(false);
      toast({
        title: "Couldn't save your profile",
        description: errMessage(err, "Please try again."),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6">
        <Logo className="h-10" />
      </div>
      <Card className="w-[460px] max-w-full rounded-none border-4 border-foreground bg-card p-8 shadow-md">
        <div className="mb-2 flex items-center gap-2">
          <UserRoundCheck className="h-6 w-6" />
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Complete your profile
          </h1>
        </div>
        <p className="mb-6 text-sm font-medium text-muted-foreground">
          Tell us a bit about yourself to finish setting up your account.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName" className={labelClass}>
                First name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                autoComplete="given-name"
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className={labelClass}>
                Last name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="jobTitle" className={labelClass}>
              Job title
            </Label>
            <JobTitleCombobox
              id="jobTitle"
              value={jobTitle}
              onChange={setJobTitle}
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Pick from the list or type your own.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full border-2 border-foreground bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
          >
            {saving ? "Saving…" : "Continue to Nacho"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
