import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageProvider, UploadOptions } from "./types";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const endpoint = getRequiredEnv("S3_ENDPOINT");
    const region = process.env.S3_REGION ?? "us-east-1";

    this.bucket = getRequiredEnv("S3_BUCKET");
    this.publicUrl = getRequiredEnv("S3_PUBLIC_URL").replace(/\/$/, "");

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload(
    key: string,
    body: Buffer | Uint8Array,
    options: UploadOptions,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key.replace(/^\//, "")}`;
  }
}
