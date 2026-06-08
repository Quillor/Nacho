import { useEffect, useRef, useState } from "react";
import { getGetDesktopReleaseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import {
  useDesktopRelease,
  useUpdateDesktopReleaseMutation,
} from "../api";
import { uploadReleaseFile } from "../lib/upload";

/**
 * Loads the current desktop release, exposes editable version/notes plus the
 * pending .dmg file, and publishes by uploading the file then saving the row.
 * Publishing always requires a fresh .dmg (the API stores the binary's object
 * path), so `canSave` requires a selected file. Leaves the view presentational.
 */
export function useDesktopReleaseEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: release, isLoading } = useDesktopRelease();
  const updateRelease = useUpdateDesktopReleaseMutation();

  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (release && !isInitialized.current) {
      setVersion(release.version ?? "");
      setNotes(release.notes ?? "");
      isInitialized.current = true;
    }
  }, [release]);

  const hasExisting = Boolean(release?.version);
  const canSave = version.trim().length > 0 && file !== null;
  const isSaving = updateRelease.isPending || uploadProgress !== null;

  const save = async () => {
    if (!canSave || isSaving || !file) return;
    try {
      setUploadProgress(0);
      const { objectPath, fileSize } = await uploadReleaseFile(
        file,
        setUploadProgress,
      );
      setUploadProgress(null);

      await updateRelease.mutateAsync({
        data: { version: version.trim(), objectPath, fileSize, notes },
      });
      toast({ title: "Desktop release published" });
      setFile(null);
      queryClient.invalidateQueries({
        queryKey: getGetDesktopReleaseQueryKey(),
      });
    } catch {
      setUploadProgress(null);
      toast({
        title: "Failed to publish desktop release",
        variant: "destructive",
      });
    }
  };

  return {
    release,
    isLoading,
    version,
    setVersion,
    notes,
    setNotes,
    file,
    setFile,
    uploadProgress,
    canSave,
    isSaving,
    hasExisting,
    save,
  };
}
