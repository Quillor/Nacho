import { useEffect, useState } from "react";
import { User, Check } from "lucide-react";
import { useUser } from "@clerk/react";
import { Button } from "@workspace/pico-ui/button";
import { Card } from "@workspace/pico-ui/card";
import { Input } from "@workspace/pico-ui/input";
import { Label } from "@workspace/pico-ui/label";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  cardClass,
  errMessage,
  getDisplayName,
  headingClass,
  inputClass,
  labelClass,
} from "../account";

/** Edit the Clerk `displayName` stored in `unsafeMetadata`. */
export function ProfileNameCard() {
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
        className="mt-6 border border-foreground bg-accent font-bold text-accent-foreground hover:bg-accent/90"
      >
        <Check className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save name"}
      </Button>
    </Card>
  );
}
