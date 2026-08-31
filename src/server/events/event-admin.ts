import { getSession } from "@/server/auth/session";
import { enforceEventAccess } from "@/server/permissions/enforce";

export interface EventAdminContext {
  canEdit: boolean;
  userId?: string;
}

export async function getEventAdminContext(eventId: string): Promise<EventAdminContext> {
  const session = await getSession();

  if (!session?.user?.id) {
    return { canEdit: false };
  }

  try {
    await enforceEventAccess(session.user.id, eventId, "event:update");
    return { canEdit: true, userId: session.user.id };
  } catch {
    return { canEdit: false };
  }
}
