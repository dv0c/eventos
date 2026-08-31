"use client";

import { Clock, MapPin, Plus, Trash2, User, CalendarClock } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EventPageHeader } from "@/components/events/event-page-header";
import { EventSection } from "@/components/events/event-section";
import { EmptyState } from "@/components/shared/empty-state";
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

interface TimelineEntry {
  id: string;
  time: string;
  title: string;
  location: string | null;
  description: string | null;
  responsible: string | null;
  sortOrder: number;
}

interface TimelineEditorProps {
  eventId: string;
  initialItems: TimelineEntry[];
}

export function TimelineEditor({ eventId, initialItems }: TimelineEditorProps) {
  const t = useTranslations("timeline");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({
    time: "",
    title: "",
    location: "",
    description: "",
    responsible: "",
  });

  const refreshItems = useCallback(async () => {
    const response = await fetch(`/api/events/${eventId}/timeline`);
    if (!response.ok) return;
    const json = await response.json();
    setItems(json.data.items);
  }, [eventId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: newItem.time,
          title: newItem.title,
          location: newItem.location || null,
          description: newItem.description || null,
          responsible: newItem.responsible || null,
        }),
      });

      if (!response.ok) {
        toast.error(t("createError"));
        return;
      }

      toast.success(t("createSuccess"));
      setShowAdd(false);
      setNewItem({ time: "", title: "", location: "", description: "", responsible: "" });
      await refreshItems();
    } catch {
      toast.error(t("createError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/timeline/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error(tCommon("error"));
        return;
      }

      toast.success(t("deleteSuccess"));
      await refreshItems();
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
            {t("addItem")}
          </Button>
        }
      />

      <EventSection title={t("scheduleTitle")}>
          {items.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={t("noItems")}
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <div className="relative space-y-0">
              <div className="absolute bottom-0 left-[1.125rem] top-0 w-px bg-border/60" />
              {items.map((item) => (
                <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/40">
                    <Clock className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-secondary/20 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-accent-foreground">{item.time}</p>
                        <p className="mt-1 text-base font-medium">{item.title}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        disabled={isLoading}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {item.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </span>
                      ) : null}
                      {item.responsible ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {item.responsible}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </EventSection>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addItem")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="time">{t("time")}</Label>
                <Input
                  id="time"
                  placeholder="18:00"
                  value={newItem.time}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">{t("itemTitle")}</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("location")}</Label>
              <Input
                id="location"
                value={newItem.location}
                onChange={(e) => setNewItem((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">{t("responsible")}</Label>
              <Input
                id="responsible"
                value={newItem.responsible}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, responsible: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <textarea
                id="description"
                rows={3}
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, description: e.target.value }))
                }
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
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
