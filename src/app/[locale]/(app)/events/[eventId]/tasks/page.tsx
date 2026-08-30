import { notFound } from "next/navigation";

import { TaskBoard } from "@/components/tasks/task-board";
import {
  getActiveOrganizationId,
  requireAuth,
} from "@/server/auth/session";
import { eventRepository } from "@/server/repositories/event.repository";
import { taskService } from "@/server/services/task.service";

interface TasksPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventTasksPage({ params }: TasksPageProps) {
  const { eventId } = await params;
  const session = await requireAuth();
  const organizationId = await getActiveOrganizationId();

  if (!organizationId) {
    notFound();
  }

  const event = await eventRepository.findById(organizationId, eventId);
  if (!event) {
    notFound();
  }

  const { tasks, stats } = await taskService.listTasks(session.user.id, eventId);

  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
  }));

  return (
    <TaskBoard
      eventId={eventId}
      initialTasks={serializedTasks}
      initialStats={stats}
    />
  );
}
