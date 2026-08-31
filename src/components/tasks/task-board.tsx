"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { CheckCircle2, Circle, Clock, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EventPageHeader } from "@/components/events/event-page-header";
import { EventSection } from "@/components/events/event-section";
import { EventStatStrip } from "@/components/events/event-stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskItem {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: { id: string; name: string | null; email: string } | null;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface TaskBoardProps {
  eventId: string;
  initialTasks: TaskItem[];
  initialStats: TaskStats;
}

const STATUS_KEYS: Record<TaskStatus, string> = {
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  DONE: "done",
};

const PRIORITY_KEYS: Record<TaskPriority, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
};

export function TaskBoard({ eventId, initialTasks, initialStats }: TaskBoardProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");

  const [tasks, setTasks] = useState(initialTasks);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
  });

  const refreshTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    const response = await fetch(`/api/events/${eventId}/tasks?${params.toString()}`);
    if (!response.ok) return;
    const json = await response.json();
    setTasks(json.data.tasks);
    setStats(json.data.stats);
  }, [eventId, search, statusFilter]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (!query) return true;
      return (
        task.name.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [tasks, search, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTask.name,
          description: newTask.description || null,
          priority: newTask.priority,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        toast.error(t("createError"));
        return;
      }

      toast.success(t("createSuccess"));
      setShowAdd(false);
      setNewTask({ name: "", description: "", priority: "MEDIUM", dueDate: "" });
      await refreshTasks();
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        toast.error(tCommon("error"));
        return;
      }

      await refreshTasks();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error(tCommon("error"));
        return;
      }

      toast.success(t("deleteSuccess"));
      await refreshTasks();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <EventPageHeader
        title={t("title")}
        action={
          <Button variant="gold" onClick={() => setShowAdd(true)} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addTask")}
          </Button>
        }
      />

      <EventStatStrip
        stats={[
          { label: t("stats.total"), value: stats.total },
          { label: t("stats.todo"), value: stats.todo },
          { label: t("stats.inProgress"), value: stats.inProgress },
          { label: t("stats.done"), value: stats.done },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TaskStatus | "ALL")}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tCommon("all")}</SelectItem>
            {(Object.keys(STATUS_KEYS) as TaskStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {t(`statuses.${STATUS_KEYS[status]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <EventSection title={t("listTitle")}>
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">{t("noTasks")}</p>
              <Button
                variant="gold"
                size="sm"
                className="mt-4"
                onClick={() => setShowAdd(true)}
              >
                {t("addTask")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
            {filteredTasks.map((task) => {
              const StatusIcon = STATUS_ICONS[task.status];

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        task.status === "DONE" ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium ${
                          task.status === "DONE" ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {task.name}
                      </p>
                      {task.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t(`priorities.${PRIORITY_KEYS[task.priority]}`)}
                        </Badge>
                        {task.dueDate ? (
                          <Badge variant="secondary">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={task.status}
                      disabled={isLoading}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value as TaskStatus)
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_KEYS) as TaskStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`statuses.${STATUS_KEYS[status]}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={isLoading}
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
      </EventSection>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addTask")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">{t("taskName")}</Label>
              <Input
                id="taskName"
                value={newTask.name}
                onChange={(e) => setNewTask((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">{t("description")}</Label>
              <textarea
                id="taskDescription"
                rows={3}
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, description: e.target.value }))
                }
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("priority")}</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({ ...prev, priority: value as TaskPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_KEYS) as TaskPriority[]).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(`priorities.${PRIORITY_KEYS[priority]}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t("dueDate")}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" variant="gold" disabled={isLoading}>
                {tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
