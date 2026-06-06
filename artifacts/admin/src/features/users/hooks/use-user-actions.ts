import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminUserQueryKey,
  getListAdminUsersQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  useSetRoleMutation,
  useSetGroupsMutation,
  useImpersonateMutation,
} from "../api";

/**
 * Encapsulates the mutating user-detail actions (role, group membership,
 * impersonation) together with their toasts and cache invalidation, so the
 * detail view only deals with presentation + local dialog state.
 */
export function useUserActions(userId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const setRole = useSetRoleMutation();
  const setGroups = useSetGroupsMutation();
  const impersonate = useImpersonateMutation();

  // Both the detail row and the list table reflect role/group changes, so
  // invalidate both after a successful mutation.
  const invalidateUserViews = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminUserQueryKey(userId) });
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  const setSuperAdmin = (checked: boolean) => {
    const role = checked ? "super_admin" : "user";
    setRole.mutate(
      { userId, data: { role } },
      {
        onSuccess: () => {
          toast({ title: "Role updated", description: `User role is now ${role}.` });
          invalidateUserViews();
        },
        onError: () => {
          toast({ title: "Failed to update role", variant: "destructive" });
        },
      },
    );
  };

  const toggleGroup = (
    groupId: number,
    checked: boolean,
    currentGroupIds: number[],
  ) => {
    const newIds = checked
      ? [...currentGroupIds, groupId]
      : currentGroupIds.filter((id) => id !== groupId);

    setGroups.mutate(
      { userId, data: { groupIds: newIds } },
      {
        onSuccess: () => {
          toast({ title: "Groups updated" });
          invalidateUserViews();
        },
        onError: () => {
          toast({ title: "Failed to update groups", variant: "destructive" });
        },
      },
    );
  };

  const impersonateUser = (opts?: { onError?: () => void }) => {
    impersonate.mutate(
      { userId },
      {
        onSuccess: (res) => {
          window.location.href = `/sign-in?__clerk_ticket=${encodeURIComponent(res.token)}`;
        },
        onError: () => {
          toast({ title: "Impersonation failed", variant: "destructive" });
          opts?.onError?.();
        },
      },
    );
  };

  return {
    setSuperAdmin,
    toggleGroup,
    impersonateUser,
    isSettingRole: setRole.isPending,
    isSettingGroups: setGroups.isPending,
    isImpersonating: impersonate.isPending,
  };
}
