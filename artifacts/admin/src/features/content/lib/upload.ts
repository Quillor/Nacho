interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}

/**
 * Upload a file to object storage via the presigned-PUT flow (request a signed
 * URL from the API, then PUT the bytes straight to storage). Returns the
 * object path the server stores against the release row. `onProgress` reports
 * the PUT transfer fraction (0..1) for the admin UI.
 */
export async function uploadReleaseFile(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<{ objectPath: string; fileSize: number }> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) throw new Error("Failed to request upload URL");
  const { uploadURL, objectPath } = (await res.json()) as UploadUrlResponse;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadURL);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });

  return { objectPath, fileSize: file.size };
}
