export type AppLocale = "el" | "en";

const LOCALE_MAP: Record<AppLocale, string> = {
  el: "el-GR",
  en: "en-GB",
};

function resolveIntlLocale(locale: AppLocale): string {
  return LOCALE_MAP[locale];
}

export function formatDate(date: Date | string | number, locale: AppLocale): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatTime(time: string, locale: AppLocale): string {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
  if (!match) {
    return time;
  }

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);
  const date = new Date();
  date.setHours(hours, minutes, seconds, 0);

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(amount: number, locale: AppLocale): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(value);
}

export function normalizeGreekPhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-().]/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("+30")) {
    const local = digits.slice(3);
    if (/^\d{10}$/.test(local)) {
      return `+30${local}`;
    }
    return null;
  }

  if (digits.startsWith("0030")) {
    const local = digits.slice(4);
    if (/^\d{10}$/.test(local)) {
      return `+30${local}`;
    }
    return null;
  }

  if (digits.startsWith("30") && /^\d{12}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^\d{10}$/.test(digits)) {
    return `+30${digits}`;
  }

  return null;
}
