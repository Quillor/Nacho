import { useEffect, useState } from "react";
import { User, Check } from "lucide-react";
import { useUser } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { getProfile } from "@/features/auth";
import {
  cardClass,
  errMessage,
  headingClass,
  inputClass,
  labelClass,
} from "../account";

/** Edit the first name, last name, and job title stored in Clerk `unsafeMetadata`. */
export function ProfileNameCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const saved = getProfile(user?.unsafeMetadata);

  useEffect(() => {
    if (!user) return;
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setJobTitle(saved.jobTitle);
  }, [user, saved.firstName, saved.lastName, saved.jobTitle]);

  const dirty =
    !!user &&
    (firstName.trim() !== saved.firstName ||
      lastName.trim() !== saved.lastName ||
      jobTitle.trim() !== saved.jobTitle);

  const save = async () => {
    if (!user) return;
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
          // Keep the display-name field in sync so the app shell shows the full
          // name immediately.
          displayName: `${first} ${last}`.trim(),
        },
      });
      toast({ title: "Profile updated" });
    } catch (err) {
      toast({
        title: "Couldn't update profile",
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className={labelClass}>
            First name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
            autoComplete="family-name"
            className={inputClass}
          />
        </div>
      </div>
      <div className="mt-4">
        <Label htmlFor="jobTitle" className={labelClass}>
          Job title
        </Label>
        <Input
          id="jobTitle"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          autoComplete="organization-title"
          className={inputClass}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Your name is shown in the app instead of your email.
        </p>
      </div>
      <Button
        disabled={!dirty || saving}
        onClick={() => void save()}
        className="mt-6 border border-foreground bg-accent font-bold text-accent-foreground hover:bg-accent/90"
      >
        <Check className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save profile"}
      </Button>
    </Card>
  );
}
