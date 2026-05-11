import { TimezoneOption } from '../context/SettingsContext';

const TZ_MAP: Record<TimezoneOption, string> = {
  uk:  'Europe/London',    // BST (UTC+1) summer / GMT (UTC+0) winter
  ist: 'Asia/Kolkata',     // IST (UTC+5:30)
  utc: 'UTC',
};

export const TZ_LABELS: Record<TimezoneOption, string> = {
  uk:  'UK Time (BST/GMT)',
  ist: 'India (IST)',
  utc: 'UTC',
};

/**
 * Format an ISO timestamp as "HH:mm" in the given timezone.
 */
export function formatTime(iso: string, tz: TimezoneOption): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ_MAP[tz],
  }).format(new Date(iso));
}

/**
 * Format an ISO timestamp as "HH:mm:ss" in the given timezone.
 */
export function formatTimeWithSeconds(iso: string, tz: TimezoneOption): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: TZ_MAP[tz],
  }).format(new Date(iso));
}

/**
 * Format an ISO timestamp as "d MMM yyyy" in the given timezone.
 */
export function formatDate(iso: string, tz: TimezoneOption): string {
  return new Intl.DateTimeFormat('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
    timeZone: TZ_MAP[tz],
  }).format(new Date(iso));
}
