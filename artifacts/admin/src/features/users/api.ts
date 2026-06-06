import {
  useListAdminUsers,
  useGetAdminUser,
  useListGroups,
  useSetUserRole,
  useSetUserGroups,
  useImpersonateUser,
  getGetAdminUserQueryKey,
} from "@workspace/api-client-react";

/** All users, for the list/table view. */
export function useUsersList() {
  return useListAdminUsers();
}

/** A single user's detail. Disabled until a userId is present. */
export function useUserDetail(userId: string) {
  return useGetAdminUser(userId, {
    query: { enabled: !!userId, queryKey: getGetAdminUserQueryKey(userId) },
  });
}

/** Groups a user can be assigned to, for the membership picker on the detail page. */
export function useAssignableGroups() {
  return useListGroups();
}

export function useSetRoleMutation() {
  return useSetUserRole();
}

export function useSetGroupsMutation() {
  return useSetUserGroups();
}

export function useImpersonateMutation() {
  return useImpersonateUser();
}
