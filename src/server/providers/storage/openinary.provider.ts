import { openinaryDeliveryUrl } from "@/lib/openinary-url";

import type { StorageProvider, UploadOptions } from "./types";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function splitStorageKey(key: string): { folder: string; filename: string } {
  const normalized = key.replace(/^\//, "");
  const lastSlash = normalized.lastIndexOf("/");

  if (lastSlash === -1) {
    return { folder: "", filename: normalized };
  }

  return {
    folder: normalized.slice(0, lastSlash),
    filename: normalized.slice(lastSlash + 1),
  };
}

interface OpeninaryUploadFile {
  path: string;
}

interface OpeninaryUploadResponse {
  success?: boolean;
  files?: OpeninaryUploadFile[];
  errors?: Array<{ filename: string; error: string }>;
  error?: string;
}

export class OpeninaryStorageProvider implements StorageProvider {
  private readonly apiUrl: string;
  private readonly publicUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = getRequiredEnv("OPENINARY_API_URL").replace(/\/$/, "");
    this.publicUrl = getRequiredEnv("OPENINARY_PUBLIC_URL");
    this.apiKey = getRequiredEnv("OPENINARY_API_KEY");
  }

  async upload(
    key: string,
    body: Buffer | Uint8Array,
    options: UploadOptions,
  ): Promise<string> {
    const { folder, filename } = splitStorageKey(key);
    const formData = new FormData();
    const blob = new Blob([Uint8Array.from(body)], { type: options.contentType });

    formData.append("files", blob, filename);
    if (folder) {
      formData.append("folder", folder);
    }
    formData.append("names", filename);

    const response = await fetch(`${this.apiUrl}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as OpeninaryUploadResponse;

    if (!response.ok) {
      const message =
        payload.errors?.[0]?.error ??
        payload.error ??
        `Openinary upload failed (HTTP ${response.status})`;
      throw new Error(message);
    }

    const storedPath = payload.files?.[0]?.path;
    if (!storedPath) {
      throw new Error("Openinary upload succeeded but returned no storage path");
    }

    return storedPath;
  }

  async delete(key: string): Promise<void> {
    const normalizedKey = key.replace(/^\//, "");
    const response = await fetch(`${this.apiUrl}/storage/${normalizedKey}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      const message =
        payload?.error ?? payload?.message ?? `Openinary delete failed (HTTP ${response.status})`;
      throw new Error(message);
    }
  }

  async getSignedUrl(_key: string, _expiresInSeconds?: number): Promise<string> {
    throw new Error("Signed URLs are not supported with the Openinary storage provider");
  }

  getPublicUrl(key: string): string {
    return openinaryDeliveryUrl(this.publicUrl, key);
  }
}
