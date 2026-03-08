/**
 * Working days utility for SLA "days remaining" / "days overdue".
 * Excludes weekends (Sat/Sun). SA public holidays can be added later.
 */

/**
 * Check if a date is a weekend (Saturday = 6, Sunday = 0 in getDay()).
 */
function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Count working days between start (inclusive) and end (exclusive).
 * Only weekends are excluded; holidays not considered in v1.
 */
export function workingDaysBetween(start: Date, end: Date): number {
  if (end <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setUTCHours(0, 0, 0, 0);

  while (cursor < endDate) {
    if (!isWeekend(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/**
 * Working days from today (start of day UTC) to due date.
 * Positive = days remaining, negative = days overdue, 0 = due today.
 */
export function workingDaysRemainingTo(dueDateIso: string | null | undefined): number | null {
  if (dueDateIso == null || dueDateIso === '') return null;
  const due = new Date(dueDateIso);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  due.setUTCHours(0, 0, 0, 0);
  if (due > today) return workingDaysBetween(today, due);
  if (due < today) return -workingDaysBetween(due, today);
  return 0;
}
