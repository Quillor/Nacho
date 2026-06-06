import { useListEmailPreviews } from "@workspace/api-client-react";

/** Emails data access: rendered previews of every system email (sample data, never sent). */
export function useEmailPreviews() {
  return useListEmailPreviews();
}
