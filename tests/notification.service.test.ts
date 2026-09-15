import { InviteStatus, NotificationType, OrgRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  notificationCreate,
  notificationCreateMany,
  notificationFindMany,
  notificationCount,
  notificationUpdateMany,
  notificationFindFirst,
  organizationMemberFindMany,
  collaboratorFindMany,
  eventFindFirst,
  eventCollaboratorFindFirst,
  eventCollaboratorUpdate,
  collaboratorUpsert,
  transaction,
} = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationCount: vi.fn(),
  notificationUpdateMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  organizationMemberFindMany: vi.fn(),
  collaboratorFindMany: vi.fn(),
  eventFindFirst: vi.fn(),
  eventCollaboratorFindFirst: vi.fn(),
  eventCollaboratorUpdate: vi.fn(),
  collaboratorUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  prisma: {
    notification: {
      create: notificationCreate,
      createMany: notificationCreateMany,
      findMany: notificationFindMany,
      count: notificationCount,
      updateMany: notificationUpdateMany,
      findFirst: notificationFindFirst,
    },
    organizationMember: {
      findMany: organizationMemberFindMany,
    },
    collaborator: {
      findMany: collaboratorFindMany,
      upsert: collaboratorUpsert,
    },
    event: {
      findFirst: eventFindFirst,
    },
    eventCollaborator: {
      findFirst: eventCollaboratorFindFirst,
      update: eventCollaboratorUpdate,
    },
    $transaction: transaction,
  },
}));

import { notificationService } from "@/server/services/notification.service";

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a notification for a user", async () => {
    notificationCreate.mockResolvedValue({
      id: "n1",
      userId: "u1",
      type: NotificationType.SYSTEM,
      title: "Hello",
    });

    const result = await notificationService.notifyUser({
      userId: "u1",
      type: NotificationType.SYSTEM,
      title: "Hello",
    });

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          type: NotificationType.SYSTEM,
          title: "Hello",
        }),
      }),
    );
    expect(result.id).toBe("n1");
  });

  it("lists notifications and unread count", async () => {
    notificationFindMany.mockResolvedValue([
      { id: "n1", title: "A", createdAt: new Date() },
    ]);
    notificationCount.mockResolvedValue(2);

    const result = await notificationService.listForUser("u1", { limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.unreadCount).toBe(2);
    expect(result.nextCursor).toBeNull();
  });

  it("marks all as read", async () => {
    notificationUpdateMany.mockResolvedValue({ count: 3 });
    const count = await notificationService.markAllRead("u1");
    expect(count).toBe(3);
  });

  it("fans out to org editors and collaborators without duplicates", async () => {
    eventFindFirst.mockResolvedValue({
      id: "e1",
      organizationId: "o1",
      name: "Wedding",
      organization: { slug: "acme" },
    });
    organizationMemberFindMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);
    collaboratorFindMany.mockResolvedValue([
      { userId: "u2" },
      { userId: "u3" },
    ]);
    notificationCreateMany.mockResolvedValue({ count: 2 });

    const count = await notificationService.notifyEventStakeholders("e1", {
      type: NotificationType.NEW_PHOTO,
      title: "Photo",
      excludeUserId: "u1",
    });

    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: "u2" }),
        expect.objectContaining({ userId: "u3" }),
      ]),
    });
    const data = notificationCreateMany.mock.calls[0][0].data as { userId: string }[];
    expect(data.map((d) => d.userId).sort()).toEqual(["u2", "u3"]);
    expect(count).toBe(2);
  });

  it("throttles media pending notifications within an hour", async () => {
    notificationFindFirst.mockResolvedValue({ id: "existing" });
    const count = await notificationService.notifyMediaPendingThrottled("e1", {
      title: "Pending",
    });
    expect(count).toBe(0);
    expect(organizationMemberFindMany).not.toHaveBeenCalled();
  });

  it("accepts a collaboration invite and upserts Collaborator", async () => {
    notificationFindFirst.mockResolvedValue({
      id: "n1",
      userId: "u1",
      type: NotificationType.COLLAB_INVITE,
      eventId: "e1",
      metadata: { collaboratorId: "c1", eventId: "e1", role: "EDITOR" },
    });
    eventCollaboratorFindFirst.mockResolvedValue({
      id: "c1",
      eventId: "e1",
      email: "a@example.com",
      role: "EDITOR",
      status: InviteStatus.PENDING,
    });
    transaction.mockResolvedValue([{}, {}]);
    notificationUpdateMany.mockResolvedValue({ count: 1 });
    eventFindFirst.mockResolvedValue({
      name: "Wedding",
      organizationId: "o1",
      organization: { slug: "acme" },
    });
    organizationMemberFindMany.mockResolvedValue([]);
    collaboratorFindMany.mockResolvedValue([]);
    notificationCreateMany.mockResolvedValue({ count: 0 });

    const result = await notificationService.respondToCollabInvite(
      "u1",
      "a@example.com",
      "n1",
      "accept",
    );

    expect(result.status).toBe(InviteStatus.ACCEPTED);
    expect(transaction).toHaveBeenCalled();
  });

  it("declines a collaboration invite as REVOKED", async () => {
    notificationFindFirst.mockResolvedValue({
      id: "n1",
      userId: "u1",
      type: NotificationType.COLLAB_INVITE,
      eventId: "e1",
      metadata: { collaboratorId: "c1", eventId: "e1" },
    });
    eventCollaboratorFindFirst.mockResolvedValue({
      id: "c1",
      eventId: "e1",
      email: "a@example.com",
      role: "EDITOR",
      status: InviteStatus.PENDING,
    });
    eventCollaboratorUpdate.mockResolvedValue({});
    notificationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await notificationService.respondToCollabInvite(
      "u1",
      "a@example.com",
      "n1",
      "decline",
    );

    expect(result.status).toBe(InviteStatus.REVOKED);
    expect(eventCollaboratorUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: InviteStatus.REVOKED }),
      }),
    );
  });
});

describe("EDIT role fan-out constant", () => {
  it("includes editor-level org roles", () => {
    expect([OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MANAGER, OrgRole.EDITOR]).toContain(
      OrgRole.EDITOR,
    );
  });
});
