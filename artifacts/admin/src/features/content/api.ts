import { useGetTosAdmin, useUpdateTos } from "@workspace/api-client-react";

/** The current Terms of Service document (admin view). */
export function useTosDocument() {
  return useGetTosAdmin();
}

export function useUpdateTosMutation() {
  return useUpdateTos();
}
