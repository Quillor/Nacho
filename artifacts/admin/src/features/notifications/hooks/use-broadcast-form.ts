import { useState } from "react";
import type { NotificationResult } from "@workspace/api-client-react";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { useSendNotificationMutation } from "../api";

type Audience = "all" | "group";

/**
 * Owns the broadcast composer state (subject/body/audience/group), the send
 * action, and the readiness check, so the notifications view is pure
 * presentation. `groupId` is only sent when the audience is a specific group.
 */
export function useBroadcastForm() {
  const { toast } = useToast();
  const sendNotification = useSendNotificationMutation();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [groupId, setGroupId] = useState<string>("");
  const [result, setResult] = useState<NotificationResult | null>(null);

  const isReady = Boolean(
    subject.trim() &&
      body.trim() &&
      (audience === "all" || (audience === "group" && groupId)),
  );

  const send = () => {
    if (!subject.trim() || !body.trim()) return;
    if (audience === "group" && !groupId) return;

    sendNotification.mutate(
      {
        data: {
          subject,
          body,
          audience,
          groupId: audience === "group" ? parseInt(groupId, 10) : undefined,
        },
      },
      {
        onSuccess: (res) => {
          setResult(res);
          toast({ title: "Notifications processed" });
          setSubject("");
          setBody("");
        },
        onError: () => {
          toast({ title: "Failed to send notifications", variant: "destructive" });
        },
      },
    );
  };

  return {
    subject,
    setSubject,
    body,
    setBody,
    audience,
    setAudience,
    groupId,
    setGroupId,
    result,
    setResult,
    isReady,
    isSending: sendNotification.isPending,
    send,
  };
}
