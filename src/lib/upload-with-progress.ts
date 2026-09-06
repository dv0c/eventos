export interface UploadWithProgressOptions {
  url: string;
  formData: FormData;
  onProgress?: (percent: number) => void;
  method?: "POST" | "PUT" | "PATCH";
}

export class UploadWithProgressError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "UploadWithProgressError";
    this.status = status;
    this.body = body;
  }
}

export function uploadWithProgress<T = unknown>({
  url,
  formData,
  onProgress,
  method = "POST",
}: UploadWithProgressOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(body as T);
        return;
      }

      const message =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: { message?: string } }).error?.message === "string"
          ? (body as { error: { message: string } }).error.message
          : `Upload failed (HTTP ${xhr.status})`;

      reject(new UploadWithProgressError(message, xhr.status, body));
    };

    xhr.onerror = () => {
      reject(new UploadWithProgressError("Network error during upload", 0, null));
    };

    xhr.onabort = () => {
      reject(new UploadWithProgressError("Upload aborted", 0, null));
    };

    xhr.send(formData);
  });
}
