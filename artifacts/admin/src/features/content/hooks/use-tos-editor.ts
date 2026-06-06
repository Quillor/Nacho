import { useEffect, useRef, useState } from "react";
import { getGetTosAdminQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { useTosDocument, useUpdateTosMutation } from "../api";

/**
 * Loads the ToS document, mirrors it into local editable state once (a ref
 * guards against clobbering edits when the query refetches), and exposes a save
 * action plus a dirty flag, leaving the view as pure presentation.
 */
export function useTosEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tos, isLoading } = useTosDocument();
  const updateTos = useUpdateTosMutation();

  const [content, setContent] = useState("");
  const isInitialized = useRef(false);

  useEffect(() => {
    if (tos && !isInitialized.current) {
      setContent(tos.content);
      isInitialized.current = true;
    }
  }, [tos]);

  const hasChanges = Boolean(tos && content !== tos.content);

  const save = () => {
    if (!content.trim()) return;

    updateTos.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          toast({ title: "Terms of Service updated" });
          queryClient.invalidateQueries({ queryKey: getGetTosAdminQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update Terms of Service", variant: "destructive" });
        },
      },
    );
  };

  return {
    tos,
    isLoading,
    content,
    setContent,
    hasChanges,
    isSaving: updateTos.isPending,
    save,
  };
}
