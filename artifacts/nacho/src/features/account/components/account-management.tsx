import { ProfileNameCard } from "./profile-name-card";
import { EmailCard } from "./email-card";
import { PasswordCard } from "./password-card";

/** Stacked account settings: profile (name + job title), email, and password. */
export function AccountManagement() {
  return (
    <div className="space-y-6">
      <ProfileNameCard />
      <EmailCard />
      <PasswordCard />
    </div>
  );
}
