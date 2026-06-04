import { db, tosDocumentTable } from "@workspace/db";
import { logger } from "./logger";

// Sample Terms of Service so the public /terms page and the admin editor are
// immediately usable on a fresh database. Operators edit this in the admin
// Content page; the seed only runs once, when no document exists yet.
export const SAMPLE_TOS = `# Terms of Service

Welcome to Nacho. By creating an account and using Nacho you agree to these terms.

## 1. Using Nacho

Nacho is a browser-based screen recorder. You are responsible for the content you record, publish, and share.

## 2. Your account

Keep your account credentials secure. You must provide accurate information when signing up.

## 3. Acceptable use

Do not use Nacho to record or share unlawful, infringing, or harmful content.

## 4. Content ownership

You retain ownership of the recordings you create. By publishing a recording you grant us permission to host and serve it so it can be viewed via its share link.

## 5. Changes to these terms

We may update these terms from time to time. Continued use of Nacho after changes take effect means you accept the revised terms.
`;

// Idempotent: inserts the sample document only when the table is empty.
export async function seedTos(): Promise<void> {
  const [existing] = await db
    .select({ id: tosDocumentTable.id })
    .from(tosDocumentTable)
    .limit(1);
  if (existing) return;
  await db.insert(tosDocumentTable).values({ content: SAMPLE_TOS });
  logger.info("Seeded sample Terms of Service document");
}
