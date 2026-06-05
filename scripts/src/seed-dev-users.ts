import { randomBytes } from "node:crypto";
import { createClerkClient, type User } from "@clerk/backend";

// Dev-only: seed two real Clerk users for testing the Nacho app and Admin
// console — a normal user and a super admin. Idempotent: re-running updates the
// existing users' metadata (and password) instead of creating duplicates.
//
// Passwords are NEVER hardcoded: each is read from an env override if present,
// otherwise a strong random password is generated at runtime. Either way the
// final credentials are printed once at the end so you can sign in with them.
//
// Run:  pnpm --filter @workspace/scripts run seed-dev-users
// Requires: CLERK_SECRET_KEY (already configured as a secret).
// Optional: DEV_SEED_USER_PASSWORD, DEV_SEED_ADMIN_PASSWORD to pin passwords.

interface SeedSpec {
  email: string;
  password: string;
  displayName: string;
  role: "user" | "super_admin";
}

// Generate a strong random password. Includes mixed case, a digit and a symbol
// so it satisfies password policies even if skipPasswordChecks is ever removed.
function generatePassword(): string {
  return `Dv-${randomBytes(18).toString("base64url")}-9!`;
}

const SEED_USERS: SeedSpec[] = [
  {
    email: "dev-user@nacho.test",
    password: process.env.DEV_SEED_USER_PASSWORD || generatePassword(),
    displayName: "Dev User",
    role: "user",
  },
  {
    email: "dev-admin@nacho.test",
    password: process.env.DEV_SEED_ADMIN_PASSWORD || generatePassword(),
    displayName: "Dev Super Admin",
    role: "super_admin",
  },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed dev users in production (NODE_ENV=production).",
    );
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not set; cannot seed Clerk users.");
  }

  const clerk = createClerkClient({ secretKey });

  for (const spec of SEED_USERS) {
    const existing = await clerk.users.getUserList({
      emailAddress: [spec.email],
    });

    let user: User;
    if (existing.data.length > 0) {
      user = existing.data[0]!;
      await clerk.users.updateUser(user.id, {
        password: spec.password,
        skipPasswordChecks: true,
        publicMetadata: { role: spec.role },
        unsafeMetadata: { displayName: spec.displayName },
      });
      console.log(`Updated existing user: ${spec.email} (${user.id})`);
    } else {
      user = await clerk.users.createUser({
        emailAddress: [spec.email],
        password: spec.password,
        skipPasswordChecks: true,
        publicMetadata: { role: spec.role },
        unsafeMetadata: { displayName: spec.displayName },
      });
      console.log(`Created user: ${spec.email} (${user.id})`);
    }
  }

  console.log("\n=== Seeded dev credentials ===");
  for (const spec of SEED_USERS) {
    console.log(
      `${spec.role.padEnd(11)}  ${spec.email}  /  ${spec.password}`,
    );
  }
  console.log(
    "\nUse these to sign in to Nacho (/) and the Admin console (/admin/).",
  );
}

main().catch((err) => {
  console.error("Failed to seed dev users:", err);
  process.exit(1);
});
