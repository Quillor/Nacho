import {
  useListGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from "@workspace/api-client-react";

/** All user groups, with member counts, for the groups table. */
export function useGroupsList() {
  return useListGroups();
}

export function useCreateGroupMutation() {
  return useCreateGroup();
}

export function useUpdateGroupMutation() {
  return useUpdateGroup();
}

export function useDeleteGroupMutation() {
  return useDeleteGroup();
}
