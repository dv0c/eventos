"use client";

import type { Guest, GuestStatus } from "@prisma/client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { GuestImportWizard } from "@/components/guests/guest-import-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Link } from "@/i18n/navigation";

const STATUS_KEYS: Record<GuestStatus, string> = {
  PENDING: "pending",
  INVITED: "invited",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  MAYBE: "maybe",
  NO_RESPONSE: "noResponse",
};

const ALL_STATUSES = Object.keys(STATUS_KEYS) as GuestStatus[];
const ROW_HEIGHT = 52;
const VIRTUALIZE_THRESHOLD = 100;

interface GuestFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: GuestStatus;
  isVip: boolean;
  notes: string;
}

const emptyForm: GuestFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "PENDING",
  isVip: false,
  notes: "",
};

interface GuestManagerProps {
  eventId: string;
  initialGuests: Guest[];
  initialPage: number;
  totalPages: number;
  total: number;
  initialSearch?: string;
  initialStatus?: GuestStatus;
}

export function GuestManager({
  eventId,
  initialGuests,
  initialPage,
  totalPages,
  total,
  initialSearch = "",
  initialStatus,
}: GuestManagerProps) {
  const t = useTranslations("guests");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [guests, setGuests] = useState(initialGuests);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<GuestStatus | "all">(
    initialStatus ?? "all",
  );
  const [importOpen, setImportOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = guests.length >= VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: guests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    enabled: useVirtual,
  });

  const statusVariant: Record<GuestStatus, "default" | "secondary" | "outline"> = useMemo(
    () => ({
      PENDING: "outline",
      INVITED: "secondary",
      CONFIRMED: "default",
      DECLINED: "outline",
      MAYBE: "secondary",
      NO_RESPONSE: "outline",
    }),
    [],
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function openCreate() {
    setEditingGuest(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditingGuest(guest);
    setForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      status: guest.status,
      isVip: guest.isVip,
      notes: guest.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
      };

      const url = editingGuest
        ? `/api/events/${eventId}/guests/${editingGuest.id}`
        : `/api/events/${eventId}/guests`;
      const response = await fetch(url, {
        method: editingGuest ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Save failed");
      }

      toast.success(editingGuest ? tCommon("saved") : t("add"));
      setDialogOpen(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const response = await fetch(`/api/events/${eventId}/guests`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: Array.from(selected) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message);
      setSelected(new Set());
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page", "1");
    router.push(`/events/${eventId}/guests?${params.toString()}`);
  }

  function renderGuestRow(guest: Guest) {
    return (
      <tr key={guest.id} className="border-b border-border/40">
        <td className="py-3 pr-2">
          <Checkbox
            checked={selected.has(guest.id)}
            onCheckedChange={() => toggleSelect(guest.id)}
          />
        </td>
        <td className="py-3 pr-4">{guest.firstName}</td>
        <td className="py-3 pr-4">{guest.lastName}</td>
        <td className="py-3 pr-4 text-muted-foreground">{guest.email ?? "—"}</td>
        <td className="py-3 pr-4 text-muted-foreground">{guest.phone ?? "—"}</td>
        <td className="py-3">
          <Badge variant={statusVariant[guest.status]}>
            {t(`statuses.${STATUS_KEYS[guest.status]}`)}
          </Badge>
        </td>
        <td className="py-3 pl-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
            {tCommon("edit")}
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <Card className="surface-elevated">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{total} total</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              {t("import")}
            </Button>
            <Button variant="gold" size="sm" onClick={openCreate}>
              {t("add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as GuestStatus | "all")}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`statuses.${STATUS_KEYS[s]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={applyFilters}>
              {tCommon("search")}
            </Button>
          </div>

          {selected.size > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <span className="text-sm">{t("selected", { count: selected.size })}</span>
              <Button variant="destructive" size="sm" onClick={() => void handleBulkDelete()}>
                {tCommon("delete")}
              </Button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="pb-3 pr-2 w-8" />
                  <th className="pb-3 pr-4 font-medium">{t("firstName")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("lastName")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("email")}</th>
                  <th className="pb-3 pr-4 font-medium">{t("phone")}</th>
                  <th className="pb-3 font-medium">{t("status")}</th>
                  <th className="pb-3 pl-2" />
                </tr>
              </thead>
            </table>

            {useVirtual ? (
              <div
                ref={parentRef}
                className="max-h-[600px] overflow-auto"
                style={{ contain: "strict" }}
              >
                <table className="w-full text-sm">
                  <tbody
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      position: "relative",
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const guest = guests[virtualRow.index]!;
                      return (
                        <tr
                          key={guest.id}
                          className="border-b border-border/40"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            display: "table",
                            tableLayout: "fixed",
                          }}
                        >
                          <td className="py-3 pr-2 w-[5%]">
                            <Checkbox
                              checked={selected.has(guest.id)}
                              onCheckedChange={() => toggleSelect(guest.id)}
                            />
                          </td>
                          <td className="py-3 pr-4 w-[15%]">{guest.firstName}</td>
                          <td className="py-3 pr-4 w-[15%]">{guest.lastName}</td>
                          <td className="py-3 pr-4 w-[20%] text-muted-foreground">
                            {guest.email ?? "—"}
                          </td>
                          <td className="py-3 pr-4 w-[15%] text-muted-foreground">
                            {guest.phone ?? "—"}
                          </td>
                          <td className="py-3 w-[15%]">
                            <Badge variant={statusVariant[guest.status]}>
                              {t(`statuses.${STATUS_KEYS[guest.status]}`)}
                            </Badge>
                          </td>
                          <td className="py-3 pl-2 w-[15%]">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
                              {tCommon("edit")}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>{guests.map(renderGuestRow)}</tbody>
              </table>
            )}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={initialPage <= 1} asChild>
                <Link href={`/events/${eventId}/guests?page=${initialPage - 1}`}>
                  {tCommon("previous")}
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {initialPage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={initialPage >= totalPages} asChild>
                <Link href={`/events/${eventId}/guests?page=${initialPage + 1}`}>
                  {tCommon("next")}
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <GuestImportWizard
        eventId={eventId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onComplete={refresh}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGuest ? tCommon("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("firstName")}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t("lastName")}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>{t("email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t("phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t("status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as GuestStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statuses.${STATUS_KEYS[s]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("notes")}</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {tCommon("cancel")}
              </Button>
              <Button variant="gold" disabled={isSaving} onClick={() => void handleSave()}>
                {tCommon("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
