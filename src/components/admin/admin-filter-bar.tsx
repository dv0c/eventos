"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Input } from "@/components/ui/input";

export function AdminFilterBar({
  basePath,
  initial,
  extras,
}: {
  basePath: string;
  initial?: {
    q?: string;
    status?: string;
    role?: string;
    deleted?: boolean;
    tab?: string;
  };
  extras?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [q, setQ] = useState(initial?.q ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (initial?.status) params.set("status", initial.status);
    if (initial?.role) params.set("role", initial.role);
    if (initial?.deleted) params.set("deleted", "1");
    if (initial?.tab) params.set("tab", initial.tab);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    for (const [key, value] of fd.entries()) {
      if (key === "q") continue;
      if (typeof value === "string" && value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search")}
        className="max-w-xs"
      />
      {extras}
      <button
        type="submit"
        className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
      >
        {t("filter")}
      </button>
    </form>
  );
}
