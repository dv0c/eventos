import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OpeninaryStorageProvider } from "@/server/providers/storage/openinary.provider";

describe("OpeninaryStorageProvider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENINARY_API_URL: "https://evento-cdn.efindly.gr/api",
      OPENINARY_PUBLIC_URL: "https://evento-cdn.efindly.gr",
      OPENINARY_API_KEY: "test-api-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("uploads files and returns the canonical storage path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        files: [{ path: "covers/org/user/123.jpg" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpeninaryStorageProvider();
    const storedKey = await provider.upload(
      "covers/org/user/123.jpg",
      Buffer.from("fake-image"),
      { contentType: "image/jpeg" },
    );

    expect(storedKey).toBe("covers/org/user/123.jpg");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://evento-cdn.efindly.gr/api/upload",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-api-key",
        },
      }),
    );
  });

  it("builds public delivery URLs", () => {
    const provider = new OpeninaryStorageProvider();

    expect(provider.getPublicUrl("media/demo/photo.jpg")).toBe(
      "https://evento-cdn.efindly.gr/t/media/demo/photo.jpg",
    );
  });

  it("deletes files via the storage API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpeninaryStorageProvider();
    await provider.delete("media/demo/photo.jpg");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://evento-cdn.efindly.gr/api/storage/media/demo/photo.jpg",
      expect.objectContaining({
        method: "DELETE",
        headers: {
          Authorization: "Bearer test-api-key",
        },
      }),
    );
  });
});
