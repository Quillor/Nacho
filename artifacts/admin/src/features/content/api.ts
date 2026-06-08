import {
  useGetTosAdmin,
  useUpdateTos,
  useGetDesktopRelease,
  useUpdateDesktopRelease,
} from "@workspace/api-client-react";

/** The current Terms of Service document (admin view). */
export function useTosDocument() {
  return useGetTosAdmin();
}

export function useUpdateTosMutation() {
  return useUpdateTos();
}

/** The latest published desktop release (admin view). */
export function useDesktopRelease() {
  return useGetDesktopRelease();
}

export function useUpdateDesktopReleaseMutation() {
  return useUpdateDesktopRelease();
}
