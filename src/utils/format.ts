/** Human-readable byte size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit] ?? 'TB'}`;
}

/** e.g. "22 Nov 2026, 14:05" in the device's locale and timezone. */
export function formatDateTime(epochMs: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(epochMs),
  );
}

/** Relative age such as "today", "yesterday", "5 days ago". */
export function formatAgeDays(epochMs: number, now: number): string {
  const days = Math.floor((now - epochMs) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/** Stopwatch text: "05:07" under an hour, "1:05:07" from an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "Today", "Yesterday", otherwise "Tue 24 Nov" for a YYYY-MM-DD local date. */
export function formatDayLabel(localDate: string, today: string, locale?: string): string {
  if (localDate === today) return 'Today';
  const [y, m, d] = localDate.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  const days = Math.round((new Date(ty, tm - 1, td).getTime() - date.getTime()) / 86_400_000);
  if (days === 1) return 'Yesterday';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
