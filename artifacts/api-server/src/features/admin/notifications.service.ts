import { eq } from "drizzle-orm";
import { db, userGroupMembersTable } from "@workspace/db";
import { primaryEmail } from "../../lib/clerk";
import { sendEmail } from "../../lib/email";
import { broadcastEmail, emailPreviews } from "../../lib/email-templates";
import { fetchAllUsers, type AdminFailure } from "./admin.shared";

type NotificationResult = {
  sent: number;
  failed: number;
  total: number;
  message: string;
};

export async function sendNotification(data: {
  subject: string;
  body: string;
  audience: string;
  groupId?: number | null;
}): Promise<{ ok: true; data: NotificationResult } | AdminFailure> {
  const { subject, body: message, audience, groupId } = data;

  const users = await fetchAllUsers();
  let recipients: string[];

  if (audience === "group") {
    if (!groupId) {
      return { ok: false, status: 400, error: "Select a group to notify" };
    }
    const members = await db
      .select({ userId: userGroupMembersTable.userId })
      .from(userGroupMembersTable)
      .where(eq(userGroupMembersTable.groupId, groupId));
    const memberIds = new Set(members.map((m) => m.userId));
    recipients = users
      .filter((u) => memberIds.has(u.id))
      .map((u) => primaryEmail(u))
      .filter((e): e is string => !!e);
  } else {
    recipients = users
      .map((u) => primaryEmail(u))
      .filter((e): e is string => !!e);
  }

  if (recipients.length === 0) {
    return {
      ok: true,
      data: {
        sent: 0,
        failed: 0,
        total: 0,
        message: "No recipients matched this audience",
      },
    };
  }

  const { html } = broadcastEmail({ subject, body: message });

  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    const result = await sendEmail(to, subject, html);
    if (result.ok) sent++;
    else failed++;
  }

  return {
    ok: true,
    data: {
      sent,
      failed,
      total: recipients.length,
      message:
        failed > 0
          ? `${sent} sent, ${failed} failed`
          : `Sent to ${sent} recipient${sent === 1 ? "" : "s"}`,
    },
  };
}

/** Static previews of the transactional/broadcast email templates. */
export function listEmailPreviews() {
  return emailPreviews();
}
