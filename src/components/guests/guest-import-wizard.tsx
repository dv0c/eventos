"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ImportPreviewResult } from "@/server/services/import.service";

interface GuestImportWizardProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const FIELD_OPTIONS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "family",
  "notes",
  "isVip",
] as const;

export function GuestImportWizard({
  eventId,
  open,
  onOpenChange,
  onComplete,
}: GuestImportWizardProps) {
  const t = useTranslations("guests");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setMapping({});
  }, []);

  async function handleUpload(selectedFile: File) {
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("action", "preview");

      const response = await fetch(`/api/events/${eventId}/guests/import`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Import preview failed");
      }

      setPreview(result.data);
      setMapping(
        Object.fromEntries(
          Object.entries(result.data.mapping as Record<string, string | null>).map(
            ([k, v]) => [k, v],
          ),
        ),
      );
      setStep("map");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemapPreview() {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "preview");
      formData.append("mapping", JSON.stringify(mapping));

      const response = await fetch(`/api/events/${eventId}/guests/import`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Preview failed");
      }

      setPreview(result.data);
      setStep("preview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setIsLoading(true);

    const validRows = preview.rows
      .filter((r) => r.errors.length === 0 && !r.isDuplicate)
      .map(({ firstName, lastName, email, phone, family, notes, isVip, plusOne, children, partySize }) => ({
        firstName,
        lastName,
        email,
        phone,
        family,
        notes,
        isVip,
        plusOne,
        children,
        partySize,
      }));

    try {
      const response = await fetch(`/api/events/${eventId}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", rows: validRows, skipDuplicates: true }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Import failed");
      }

      toast.success(t("importSuccess", { count: result.data.imported }));
      onOpenChange(false);
      reset();
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("import")}</DialogTitle>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <Label htmlFor="import-file">XLSX / CSV</Label>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={isLoading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
          </div>
        ) : null}

        {step === "map" && preview ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {preview.columns.length} columns detected
            </p>
            {preview.columns.map((col) => (
              <div key={col} className="grid grid-cols-2 gap-2 items-center">
                <span className="text-sm font-medium">{col}</span>
                <Select
                  value={mapping[col] ?? "skip"}
                  onValueChange={(v) =>
                    setMapping((m) => ({ ...m, [col]: v === "skip" ? null : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">—</SelectItem>
                    {FIELD_OPTIONS.map((field) => (
                      <SelectItem key={field} value={field}>
                        {t(field === "isVip" ? "status" : field)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                {tCommon("back")}
              </Button>
              <Button variant="gold" disabled={isLoading} onClick={() => void handleRemapPreview()}>
                {tCommon("next")}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">{preview.validCount} valid</span>
              <span className="text-amber-600">{preview.duplicateCount} duplicates</span>
              <span className="text-red-600">{preview.errorCount} errors</span>
            </div>
            <div className="max-h-64 overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">{t("firstName")}</th>
                    <th className="p-2 text-left">{t("lastName")}</th>
                    <th className="p-2 text-left">{t("email")}</th>
                    <th className="p-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 50).map((row) => (
                    <tr key={row.rowNumber} className="border-b">
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{row.firstName}</td>
                      <td className="p-2">{row.lastName}</td>
                      <td className="p-2">{row.email ?? "—"}</td>
                      <td className="p-2 text-muted-foreground">
                        {[...row.errors, ...row.warnings].join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>
                {tCommon("back")}
              </Button>
              <Button
                variant="gold"
                disabled={isLoading || preview.validCount === 0}
                onClick={() => void handleCommit()}
              >
                Import {preview.validCount} guests
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
