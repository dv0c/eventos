import { EventStatus, QRCodeType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const transaction = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    event: { findFirst },
    $transaction: transaction,
  },
}));

describe("revokeGuestConnectIfEnded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns false and does not mutate when event is not ended", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    future.setHours(0, 0, 0, 0);

    findFirst.mockResolvedValue({
      id: "evt-1",
      status: EventStatus.DRAFT,
      date: future,
      endTime: "23:00",
      settings: { sections: { mediaUploadToken: "tok-1" } },
    });

    const { revokeGuestConnectIfEnded } = await import(
      "@/server/events/revoke-guest-connect"
    );
    const revoked = await revokeGuestConnectIfEnded("evt-1");

    expect(revoked).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("clears album token, deletes guest QRs, and marks COMPLETED when ended", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    past.setHours(0, 0, 0, 0);

    findFirst.mockResolvedValue({
      id: "evt-2",
      status: EventStatus.DRAFT,
      date: past,
      endTime: null,
      settings: { sections: { mediaUploadToken: "tok-2", wall: {} } },
    });

    const eventSettingsUpdate = vi.fn();
    const qRCodeDeleteMany = vi.fn();
    const eventUpdate = vi.fn();

    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        eventSettings: { update: eventSettingsUpdate },
        qRCode: { deleteMany: qRCodeDeleteMany },
        event: { update: eventUpdate },
      });
    });

    const { revokeGuestConnectIfEnded, GUEST_QR_TYPES } = await import(
      "@/server/events/revoke-guest-connect"
    );
    const revoked = await revokeGuestConnectIfEnded("evt-2");

    expect(revoked).toBe(true);
    expect(eventSettingsUpdate).toHaveBeenCalledWith({
      where: { eventId: "evt-2" },
      data: { sections: { wall: {} } },
    });
    expect(qRCodeDeleteMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt-2",
        type: { in: GUEST_QR_TYPES },
      },
    });
    expect(GUEST_QR_TYPES).toEqual([
      QRCodeType.EVENT,
      QRCodeType.RSVP,
      QRCodeType.UPLOAD,
      QRCodeType.WALL,
    ]);
    expect(eventUpdate).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: { status: EventStatus.COMPLETED },
    });
  });
});
