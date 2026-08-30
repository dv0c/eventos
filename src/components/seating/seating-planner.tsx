"use client";

import type { GuestStatus, TableShape } from "@prisma/client";
import { Sparkles, Trash2, UsersRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface SeatingGuest {
  id: string;
  firstName: string;
  lastName: string;
  partySize: number;
  isVip: boolean;
  family: string | null;
  status: GuestStatus;
  seatingAssignments: Array<{ id: string; tableId: string; seatId: string | null }>;
}

interface SeatingTable {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  assignments: Array<{
    id: string;
    guest: {
      id: string;
      firstName: string;
      lastName: string;
      partySize: number;
      isVip: boolean;
    };
  }>;
}

interface SeatingStats {
  totalTables: number;
  totalCapacity: number;
  assignedGuests: number;
  unassignedGuests: number;
}

interface SeatingSuggestion {
  guestId: string;
  tableId: string;
  reason: string;
}

interface SeatingPlannerProps {
  eventId: string;
  initialTables: SeatingTable[];
  initialUnassignedGuests: SeatingGuest[];
  initialStats: SeatingStats;
}

const SHAPE_KEYS: Record<TableShape, string> = {
  ROUND: "round",
  RECTANGULAR: "rectangular",
  VIP: "vip",
  HEAD: "head",
};

export function SeatingPlanner({
  eventId,
  initialTables,
  initialUnassignedGuests,
  initialStats,
}: SeatingPlannerProps) {
  const t = useTranslations("seating");
  const tCommon = useTranslations("common");

  const [tables, setTables] = useState(initialTables);
  const [unassignedGuests, setUnassignedGuests] = useState(initialUnassignedGuests);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [suggestions, setSuggestions] = useState<SeatingSuggestion[] | null>(null);
  const [newTable, setNewTable] = useState({ name: "", capacity: "10", shape: "ROUND" as TableShape });

  const refreshSeating = useCallback(async () => {
    const response = await fetch(`/api/events/${eventId}/seating`);
    if (!response.ok) return;
    const json = await response.json();
    setTables(json.data.tables);
    setUnassignedGuests(json.data.unassignedGuests);
    setStats(json.data.stats);
  }, [eventId]);

  const filteredUnassigned = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return unassignedGuests;
    return unassignedGuests.filter((guest) =>
      `${guest.firstName} ${guest.lastName} ${guest.family ?? ""}`.toLowerCase().includes(query),
    );
  }, [unassignedGuests, search]);

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/seating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTable.name,
          capacity: Number.parseInt(newTable.capacity, 10),
          shape: newTable.shape,
        }),
      });

      if (!response.ok) {
        toast.error(t("createTableError"));
        return;
      }

      toast.success(t("createTableSuccess"));
      setShowAddTable(false);
      setNewTable({ name: "", capacity: "10", shape: "ROUND" });
      await refreshSeating();
    } catch {
      toast.error(t("createTableError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm(t("deleteTableConfirm"))) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/seating`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId }),
      });

      if (!response.ok) {
        toast.error(tCommon("error"));
        return;
      }

      toast.success(t("deleteTableSuccess"));
      await refreshSeating();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssign(guestId: string, tableId: string) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/seating/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, tableId }),
      });

      if (!response.ok) {
        toast.error(t("assignError"));
        return;
      }

      toast.success(t("assignSuccess"));
      setSuggestions(null);
      await refreshSeating();
    } catch {
      toast.error(t("assignError"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnassign(guestId: string) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/seating/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        toast.error(tCommon("error"));
        return;
      }

      toast.success(t("unassignSuccess"));
      await refreshSeating();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSuggest() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/seating/suggest`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(t("suggestError"));
        return;
      }

      const json = await response.json();
      setSuggestions(json.data.suggestions);
      toast.success(t("suggestSuccess"));
    } catch {
      toast.error(t("suggestError"));
    } finally {
      setIsLoading(false);
    }
  }

  function getTableUsedCapacity(table: SeatingTable) {
    return table.assignments.reduce((sum, a) => sum + a.guest.partySize, 0);
  }

  function getGuestName(guestId: string) {
    const fromUnassigned = unassignedGuests.find((g) => g.id === guestId);
    if (fromUnassigned) return `${fromUnassigned.firstName} ${fromUnassigned.lastName}`;

    for (const table of tables) {
      const assignment = table.assignments.find((a) => a.guest.id === guestId);
      if (assignment) {
        return `${assignment.guest.firstName} ${assignment.guest.lastName}`;
      }
    }

    return guestId;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSuggest} disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("autoSuggest")}
          </Button>
          <Button variant="gold" onClick={() => setShowAddTable(true)} disabled={isLoading}>
            {t("addTable")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="surface-elevated">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("stats.tables")}</p>
            <p className="text-2xl font-semibold">{stats.totalTables}</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("stats.capacity")}</p>
            <p className="text-2xl font-semibold">{stats.totalCapacity}</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("stats.assigned")}</p>
            <p className="text-2xl font-semibold">{stats.assignedGuests}</p>
          </CardContent>
        </Card>
        <Card className="surface-elevated">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("stats.unassigned")}</p>
            <p className="text-2xl font-semibold">{stats.unassignedGuests}</p>
          </CardContent>
        </Card>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <Card className="surface-elevated border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">{t("suggestionsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.guestId}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{getGuestName(suggestion.guestId)}</p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.tableId
                      ? `${t("suggestedTable")}: ${tables.find((table) => table.id === suggestion.tableId)?.name ?? suggestion.tableId}`
                      : t("noCapacity")}
                    {" · "}
                    {t(`reasons.${suggestion.reason}` as "reasons.vip_guest")}
                  </p>
                </div>
                {suggestion.tableId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => handleAssign(suggestion.guestId, suggestion.tableId)}
                  >
                    {t("applySuggestion")}
                  </Button>
                ) : null}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSuggestions(null)}>
              {tCommon("close")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              {t("tablesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noTables")}</p>
            ) : (
              tables.map((table) => {
                const used = getTableUsedCapacity(table);
                const isFull = used >= table.capacity;

                return (
                  <div
                    key={table.id}
                    className="rounded-lg border border-border/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`shapes.${SHAPE_KEYS[table.shape]}`)} · {used}/{table.capacity}{" "}
                          {t("seats")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isFull ? (
                          <Badge variant="secondary">{t("full")}</Badge>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={isLoading}
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {table.assignments.map((assignment) => (
                        <li
                          key={assignment.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {assignment.guest.firstName} {assignment.guest.lastName}
                            {assignment.guest.isVip ? (
                              <Badge variant="outline" className="ml-2 text-xs">
                                VIP
                              </Badge>
                            ) : null}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isLoading}
                            onClick={() => handleUnassign(assignment.guest.id)}
                          >
                            {t("unassign")}
                          </Button>
                        </li>
                      ))}
                      {table.assignments.length === 0 ? (
                        <li className="text-xs text-muted-foreground">{t("emptyTable")}</li>
                      ) : null}
                    </ul>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle>{t("unassignedTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {filteredUnassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("allAssigned")}</p>
            ) : (
              filteredUnassigned.map((guest) => (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {guest.firstName} {guest.lastName}
                      {guest.isVip ? (
                        <Badge variant="outline" className="ml-2 text-xs">
                          VIP
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {guest.partySize > 1 ? t("partySize", { count: guest.partySize }) : null}
                      {guest.family ? ` · ${guest.family}` : null}
                    </p>
                  </div>

                  <Select
                    disabled={isLoading || tables.length === 0}
                    onValueChange={(tableId) => handleAssign(guest.id, tableId)}
                  >
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder={t("assignToTable")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => {
                        const used = getTableUsedCapacity(table);
                        const remaining = table.capacity - used;
                        const canFit = remaining >= guest.partySize;

                        return (
                          <SelectItem
                            key={table.id}
                            value={table.id}
                            disabled={!canFit}
                          >
                            {table.name} ({remaining} {t("seatsLeft")})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addTable")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">{t("tableName")}</Label>
              <Input
                id="tableName"
                value={newTable.name}
                onChange={(e) => setNewTable((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">{t("capacity")}</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={50}
                  value={newTable.capacity}
                  onChange={(e) => setNewTable((prev) => ({ ...prev, capacity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("shape")}</Label>
                <Select
                  value={newTable.shape}
                  onValueChange={(value) =>
                    setNewTable((prev) => ({ ...prev, shape: value as TableShape }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SHAPE_KEYS) as TableShape[]).map((shape) => (
                      <SelectItem key={shape} value={shape}>
                        {t(`shapes.${SHAPE_KEYS[shape]}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddTable(false)}>
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
