import { describe, expect, it } from "vitest";

import {
  openinaryDeliveryUrl,
  openinaryTransformUrl,
} from "@/lib/openinary-url";

describe("openinary-url", () => {
  const publicUrl = "https://evento-cdn.efindly.gr";

  it("builds delivery URLs without transformation", () => {
    expect(openinaryDeliveryUrl(publicUrl, "covers/org/user/123.jpg")).toBe(
      "https://evento-cdn.efindly.gr/t/covers/org/user/123.jpg",
    );
  });

  it("strips leading slashes from storage keys", () => {
    expect(openinaryDeliveryUrl(publicUrl, "/media/event/abc.jpg")).toBe(
      "https://evento-cdn.efindly.gr/t/media/event/abc.jpg",
    );
  });

  it("builds transformed URLs", () => {
    expect(
      openinaryTransformUrl(publicUrl, "media/event/abc.jpg", "w_800,h_600,c_fill,f_webp"),
    ).toBe(
      "https://evento-cdn.efindly.gr/t/w_800,h_600,c_fill,f_webp/media/event/abc.jpg",
    );
  });
});
