import { OpeninaryStorageProvider } from "./openinary.provider";
import { S3StorageProvider } from "./s3.provider";
import type { StorageProvider } from "./types";

let storageProvider: StorageProvider | null = null;

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();

  if (provider === "s3") {
    return new S3StorageProvider();
  }

  if (process.env.OPENINARY_API_KEY) {
    return new OpeninaryStorageProvider();
  }

  if (provider === "openinary") {
    return new OpeninaryStorageProvider();
  }

  return new S3StorageProvider();
}

export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = createStorageProvider();
  }
  return storageProvider;
}
