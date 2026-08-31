export interface UploadOptions {
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageProvider {
  upload(key: string, body: Buffer | Uint8Array, options: UploadOptions): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(key: string): string;
}
