/**
 * dates.js — small, pure date helpers.
 *
 * All dates are local-time and day-accurate ("2026-11-23" means local midnight
 * on 23 November, never UTC). Keeping these separate lets calc.js stay a pure,
 * testable module with no DOM or storage knowledge.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Parse "YYYY-MM-DD" as local midnight (new Date('YYYY-MM-DD') would treat it as UTC). */
export function parseISO(iso) {
  if (iso instanceof Date) return startOfDay(iso);
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return startOfDay(new Date());
  return new Date(y, m - 1, d);
}

export function toISO(value) {
  const date = startOfDay(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isValidISO(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function addDays(value, amount) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + amount);
  return date;
}

/**
 * Add whole months, keeping the day where possible (31 Jan + 1 month = 28/29 Feb
 * instead of rolling into March).
 */
export function addMonths(value, amount) {
  const date = startOfDay(value);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return startOfDay(target);
}

/** First day of the calendar week containing `value`. weekStartDay: 0 = Sunday, 6 = Saturday. */
export function startOfWeek(value, weekStartDay = 1) {
  const date = startOfDay(value);
  const shift = (date.getDay() - weekStartDay + 7) % 7;
  return addDays(date, -shift);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

export function isSameDay(a, b) {
  return toISO(a) === toISO(b);
}
