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
    });

    const { revokeGuestConnectIfEnded } = await import(
      "@/server/events/revoke-guest-connect"
    );
    const revoked = await revokeGuestConnectIfEnded("evt-1");

    expect(revoked).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("keeps upload token and UPLOAD QR, deletes other guest QRs, and marks COMPLETED", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    past.setHours(0, 0, 0, 0);

    findFirst.mockResolvedValue({
      id: "evt-2",
      status: EventStatus.DRAFT,
      date: past,
      endTime: null,
    });

    const qRCodeDeleteMany = vi.fn();
    const eventUpdate = vi.fn();

    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        qRCode: { deleteMany: qRCodeDeleteMany },
        event: { update: eventUpdate },
      });
    });

    const { revokeGuestConnectIfEnded, REVOKED_GUEST_QR_TYPES, GUEST_QR_TYPES } =
      await import("@/server/events/revoke-guest-connect");
    const revoked = await revokeGuestConnectIfEnded("evt-2");

    expect(revoked).toBe(true);
    expect(qRCodeDeleteMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt-2",
        type: { in: REVOKED_GUEST_QR_TYPES },
      },
    });
    expect(REVOKED_GUEST_QR_TYPES).toEqual([
      QRCodeType.EVENT,
      QRCodeType.RSVP,
      QRCodeType.WALL,
    ]);
    expect(GUEST_QR_TYPES).toContain(QRCodeType.UPLOAD);
    expect(REVOKED_GUEST_QR_TYPES).not.toContain(QRCodeType.UPLOAD);
    expect(eventUpdate).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: { status: EventStatus.COMPLETED },
    });
  });
});
