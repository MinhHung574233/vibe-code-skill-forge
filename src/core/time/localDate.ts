/** Calendar day in the device's local timezone, `YYYY-MM-DD`. Stored at write time, never recomputed. */
export type LocalDate = string;

const pad = (n: number): string => String(n).padStart(2, '0');

export function toLocalDate(epochMs: number): LocalDate {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLocalDate(value: string): value is LocalDate {
  const m = LOCAL_DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

/**
 * Add whole days to a LocalDate. Uses UTC arithmetic on the calendar date, so DST
 * transitions (23/25-hour days) can never skip or repeat a day.
 */
export function addDays(date: LocalDate, days: number): LocalDate {
  const m = LOCAL_DATE_RE.exec(date);
  if (!m || !isLocalDate(date)) throw new RangeError(`Invalid LocalDate: ${date}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  const parse = (s: LocalDate): number => {
    const m = LOCAL_DATE_RE.exec(s);
    if (!m || !isLocalDate(s)) throw new RangeError(`Invalid LocalDate: ${s}`);
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  return Math.round((parse(b) - parse(a)) / 86_400_000);
}
