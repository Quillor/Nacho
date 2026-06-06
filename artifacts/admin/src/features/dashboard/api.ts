import { useGetAdminSummary } from "@workspace/api-client-react";

/** Dashboard data access: the aggregate admin summary (counts + recent signups). */
export function useDashboardSummary() {
  return useGetAdminSummary();
}
