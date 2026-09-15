import { NotificationType } from "@prisma/client";

import { notificationService } from "@/server/services/notification.service";

/** Fire-and-forget so producers never fail the primary action. */
export function enqueueNotification(
  work: () => Promise<unknown>,
): void {
  void work().catch((error) => {
    console.error("[notifications]", error);
  });
}

export function eventMediaLink(orgSlug: string, eventId: string) {
  return `/org/${orgSlug}/events/${eventId}/media`;
}

export function eventModLink(eventId: string) {
  return `/mod/${eventId}`;
}

export function eventOverviewLink(orgSlug: string, eventId: string) {
  return `/org/${orgSlug}/events/${eventId}/overview`;
}

export function eventCollaboratorsLink(orgSlug: string, eventId: string) {
  return `/org/${orgSlug}/events/${eventId}/collaborators`;
}

export { NotificationType, notificationService };
