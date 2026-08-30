import { GuestStatus } from "@prisma/client";
import * as XLSX from "xlsx";

import { guestRepository } from "@/server/repositories/guest.repository";

const GREEK_COLUMN_MAP: Record<string, keyof ImportGuestRow> = {
  όνομα: "firstName",
  ονομα: "firstName",
  firstname: "firstName",
  "first name": "firstName",
  first_name: "firstName",
  επώνυμο: "lastName",
  επωνυμο: "lastName",
  lastname: "lastName",
  "last name": "lastName",
  last_name: "lastName",
  email: "email",
  "e-mail": "email",
  ηλεκτρονικό: "email",
  τηλέφωνο: "phone",
  τηλεφωνο: "phone",
  phone: "phone",
  mobile: "phone",
  κινητό: "phone",
  οικογένεια: "family",
  οικογενεια: "family",
  family: "family",
  σημειώσεις: "notes",
  σημειωσεις: "notes",
  notes: "notes",
  vip: "isVip",
};

export interface ImportGuestRow {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  family?: string | null;
  notes?: string | null;
  isVip?: boolean;
  plusOne?: boolean;
  children?: number;
  partySize?: number;
}

export interface ImportPreviewRow extends ImportGuestRow {
  rowNumber: number;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface ImportPreviewResult {
  columns: string[];
  mapping: Record<string, keyof ImportGuestRow | null>;
  rows: ImportPreviewRow[];
  validCount: number;
  errorCount: number;
  duplicateCount: number;
}

export interface ImportCommitResult {
  imported: number;
  skipped: number;
  errors: { rowNumber: number; message: string }[];
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("69")) {
    return `+30${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("30")) {
    return `+${digits}`;
  }
  return phone.trim();
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function autoMapColumns(headers: string[]): Record<string, keyof ImportGuestRow | null> {
  const mapping: Record<string, keyof ImportGuestRow | null> = {};
  for (const header of headers) {
    const key = normalizeHeader(header);
    mapping[header] = GREEK_COLUMN_MAP[key] ?? null;
  }
  return mapping;
}

function parseRawRows(buffer: Buffer, fileName: string): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const isCsv = fileName.toLowerCase().endsWith(".csv");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: !isCsv,
  });
}

function mapRow(
  raw: Record<string, unknown>,
  mapping: Record<string, keyof ImportGuestRow | null>,
): Partial<ImportGuestRow> {
  const result: Partial<ImportGuestRow> = {};

  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    const value = raw[header];
    if (value === undefined || value === "") continue;

    if (field === "isVip") {
      result.isVip = String(value).toLowerCase() === "true" || value === 1 || String(value).toLowerCase() === "ναι";
    } else if (field === "children" || field === "partySize") {
      result[field] = Number.parseInt(String(value), 10) || 0;
    } else if (field === "plusOne") {
      result.plusOne = String(value).toLowerCase() === "true" || value === 1;
    } else {
      result[field] = String(value).trim();
    }
  }

  if (result.phone) {
    result.phone = normalizePhone(result.phone);
  }

  return result;
}

function validateRow(row: Partial<ImportGuestRow>, rowNumber: number): ImportPreviewRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.firstName?.trim()) errors.push("First name is required");
  if (!row.lastName?.trim()) errors.push("Last name is required");
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push("Invalid email format");
  }

  return {
    rowNumber,
    firstName: row.firstName?.trim() ?? "",
    lastName: row.lastName?.trim() ?? "",
    email: row.email ?? null,
    phone: row.phone ?? null,
    family: row.family ?? null,
    notes: row.notes ?? null,
    isVip: row.isVip ?? false,
    plusOne: row.plusOne ?? false,
    children: row.children ?? 0,
    partySize: row.partySize ?? 1,
    errors,
    warnings,
    isDuplicate: false,
  };
}

export const importService = {
  async preview(
    eventId: string,
    buffer: Buffer,
    fileName: string,
    customMapping?: Record<string, keyof ImportGuestRow | null>,
  ): Promise<ImportPreviewResult> {
    const rawRows = parseRawRows(buffer, fileName);
    if (rawRows.length === 0) {
      return {
        columns: [],
        mapping: {},
        rows: [],
        validCount: 0,
        errorCount: 0,
        duplicateCount: 0,
      };
    }

    const columns = Object.keys(rawRows[0] ?? {});
    const mapping = customMapping ?? autoMapColumns(columns);

    const rows: ImportPreviewRow[] = [];
    const seenKeys = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const mapped = mapRow(rawRows[i]!, mapping);
      const preview = validateRow(mapped, i + 2);

      const dupKey = [
        preview.email?.toLowerCase(),
        preview.phone,
        `${preview.firstName.toLowerCase()}|${preview.lastName.toLowerCase()}`,
      ]
        .filter(Boolean)
        .join(":");

      if (dupKey && seenKeys.has(dupKey)) {
        preview.isDuplicate = true;
        preview.warnings.push("Duplicate in file");
      } else if (dupKey) {
        seenKeys.add(dupKey);
      }

      if (preview.email || preview.phone) {
        const existing = await guestRepository.findDuplicates(
          eventId,
          preview.email,
          preview.phone,
        );
        if (existing.length > 0) {
          preview.isDuplicate = true;
          preview.warnings.push("Matches existing guest");
        }
      }

      rows.push(preview);
    }

    return {
      columns,
      mapping,
      rows,
      validCount: rows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length,
      errorCount: rows.filter((r) => r.errors.length > 0).length,
      duplicateCount: rows.filter((r) => r.isDuplicate).length,
    };
  },

  async commit(
    eventId: string,
    rows: ImportGuestRow[],
    skipDuplicates = true,
  ): Promise<ImportCommitResult> {
    let imported = 0;
    let skipped = 0;
    const errors: { rowNumber: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const existing = await guestRepository.findDuplicates(
          eventId,
          row.email,
          row.phone,
        );
        if (existing.length > 0 && skipDuplicates) {
          skipped++;
          continue;
        }

        await guestRepository.create(eventId, {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          family: row.family,
          notes: row.notes,
          isVip: row.isVip ?? false,
          plusOne: row.plusOne ?? false,
          children: row.children ?? 0,
          partySize: row.partySize ?? 1,
          status: GuestStatus.PENDING,
        });
        imported++;
      } catch (error) {
        errors.push({
          rowNumber: i + 1,
          message: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    return { imported, skipped, errors };
  },

  parseMapping(headers: string[]): Record<string, keyof ImportGuestRow | null> {
    return autoMapColumns(headers);
  },
};
