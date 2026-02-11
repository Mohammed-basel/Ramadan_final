import { Language } from './productMeta';

function parseISODate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatRange(start: Date, end: Date, language: Language): string {
  const locale = language === 'ar' ? 'ar-PS' : 'en-US';
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: '2-digit' });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

/**
 * Optional week start dates via env:
 * VITE_WEEK_STARTS="2026-02-08,2026-02-15,2026-02-22,2026-03-01"
 */
export function getWeekDateRangeLabel(weekNumber: number, language: Language): string | null {
  const raw = (import.meta as any)?.env?.VITE_WEEK_STARTS as string | undefined;
  if (!raw) return null;

  const parts = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const start = parseISODate(parts[weekNumber - 1]);
  if (!start) return null;

  const end = addDays(start, 6);
  return formatRange(start, end, language);
}

export function formatWeekLabel(weekNumber: number, language: Language, weekDate?: string): string {
  const base = language === 'ar' ? `الأسبوع ${weekNumber}` : `Week ${weekNumber}`;

  const explicit = weekDate?.trim();
  if (explicit) return `${base} (${explicit})`;

  const range = getWeekDateRangeLabel(weekNumber, language);
  return range ? `${base} (${range})` : base;
}