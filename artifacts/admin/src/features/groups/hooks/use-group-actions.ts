import { useQueryClient } from "@tanstack/react-query";
import { getListGroupsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from "../api";
import type { GroupFormData } from "../types";

/**
 * Group create/update/delete orchestration: each action owns its toast and
 * cache invalidation and calls back into the view (via onSuccess) only for the
 * local dialog state, keeping the view free of mutation wiring.
 */
export function useGroupActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGroup = useCreateGroupMutation();
  const updateGroup = useUpdateGroupMutation();
  const deleteGroup = useDeleteGroupMutation();

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
  };

  const create = (data: GroupFormData, opts?: { onSuccess?: () => void }) => {
    createGroup.mutate(
      { data: { name: data.name, description: data.description } },
      {
        onSuccess: () => {
          toast({ title: "Group created" });
          opts?.onSuccess?.();
          invalidateGroups();
        },
        onError: () => toast({ title: "Failed to create group", variant: "destructive" }),
      },
    );
  };

  const update = (
    groupId: number,
    data: GroupFormData,
    opts?: { onSuccess?: () => void },
  ) => {
    updateGroup.mutate(
      { groupId, data: { name: data.name, description: data.description } },
      {
        onSuccess: () => {
          toast({ title: "Group updated" });
          opts?.onSuccess?.();
          invalidateGroups();
        },
        onError: () => toast({ title: "Failed to update group", variant: "destructive" }),
      },
    );
  };

  const remove = (groupId: number, opts?: { onSettled?: () => void }) => {
    deleteGroup.mutate(
      { groupId },
      {
        onSuccess: () => {
          toast({ title: "Group deleted" });
          opts?.onSettled?.();
          invalidateGroups();
        },
        onError: () => {
          toast({ title: "Failed to delete group", variant: "destructive" });
          opts?.onSettled?.();
        },
      },
    );
  };

  return {
    create,
    update,
    remove,
    isSaving: createGroup.isPending || updateGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
}
