import {
  AuditAction,
  TaskPriority,
  TaskStatus,
  type Prisma,
  type Task,
} from "@prisma/client";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";

import { auditService } from "./audit.service";

export class TaskServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "TaskServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface CreateTaskInput {
  name: string;
  description?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface ListTasksInput {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

const taskInclude = {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.TaskInclude;

async function ensureTaskBelongsToEvent(eventId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, eventId },
  });

  if (!task) {
    throw new TaskServiceError("Task not found", 404, "TASK_NOT_FOUND");
  }

  return task;
}

export const taskService = {
  async listTasks(userId: string, eventId: string, options: ListTasksInput = {}) {
    await enforceEventAccess(userId, eventId, "task:read");

    const where: Prisma.TaskWhereInput = { eventId };

    if (options.status) {
      where.status = options.status;
    }
    if (options.priority) {
      where.priority = options.priority;
    }
    if (options.search?.trim()) {
      const search = options.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    const stats = {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
      done: tasks.filter((task) => task.status === TaskStatus.DONE).length,
    };

    return { tasks, stats };
  },

  async createTask(
    userId: string,
    eventId: string,
    input: CreateTaskInput,
    ipAddress?: string,
  ): Promise<Task> {
    const access = await enforceEventAccess(userId, eventId, "task:update");

    if (input.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assigneeId },
        select: { id: true },
      });
      if (!assignee) {
        throw new TaskServiceError("Assignee not found", 404, "ASSIGNEE_NOT_FOUND");
      }
    }

    const task = await prisma.task.create({
      data: {
        eventId,
        name: input.name.trim(),
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        dueDate: input.dueDate ?? null,
        priority: input.priority ?? TaskPriority.MEDIUM,
        status: input.status ?? TaskStatus.TODO,
      },
      include: taskInclude,
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Task",
      entityId: task.id,
      metadata: { action: "created", name: task.name },
      ipAddress,
    });

    return task;
  },

  async updateTask(
    userId: string,
    eventId: string,
    taskId: string,
    input: UpdateTaskInput,
    ipAddress?: string,
  ) {
    const access = await enforceEventAccess(userId, eventId, "task:update");
    await ensureTaskBelongsToEvent(eventId, taskId);

    if (input.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assigneeId },
        select: { id: true },
      });
      if (!assignee) {
        throw new TaskServiceError("Assignee not found", 404, "ASSIGNEE_NOT_FOUND");
      }
    }

    const data: Prisma.TaskUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description;
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId
        ? { connect: { id: input.assigneeId } }
        : { disconnect: true };
    }
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) data.status = input.status;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Task",
      entityId: taskId,
      metadata: { action: "updated", ...input } as Prisma.InputJsonValue,
      ipAddress,
    });

    return task;
  },

  async deleteTask(
    userId: string,
    eventId: string,
    taskId: string,
    ipAddress?: string,
  ): Promise<void> {
    const access = await enforceEventAccess(userId, eventId, "task:update");
    await ensureTaskBelongsToEvent(eventId, taskId);

    await prisma.task.delete({ where: { id: taskId } });

    await auditService.logAudit({
      userId,
      organizationId: access.organizationId,
      eventId,
      action: AuditAction.EVENT_UPDATED,
      entity: "Task",
      entityId: taskId,
      metadata: { action: "deleted" },
      ipAddress,
    });
  },
};
