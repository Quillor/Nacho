import { useListGroups, useSendNotification } from "@workspace/api-client-react";

/** Groups available as a broadcast audience. */
export function useNotificationGroups() {
  return useListGroups();
}

export function useSendNotificationMutation() {
  return useSendNotification();
}
