import { S3StorageProvider } from "./s3.provider";
import type { StorageProvider } from "./types";

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = new S3StorageProvider();
  }
  return storageProvider;
}
