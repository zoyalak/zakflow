/**
 * calc.js — the money maths. Pure functions only: no DOM, no storage,
 * no Date.now(). Pass `today` in and the same input always gives the same
 * plan, which is what makes the redistribution rule easy to test.
 *
 * THE RULE
 * --------
 *   budget for each remaining week = (total balance − all spending so far)
 *                                    ÷ (number of weeks remaining, current week included)
 *
 * Spend less than a week's budget and `remaining` grows while the week count
 * stays the same, so every remaining week (this one too) gets a bigger share.
 * Overspend and the share shrinks by exactly the extra ÷ weeks left. Past
 * weeks are never recalculated: their money is already spent, their number is
 * final, and they do not take a second share of the split.
 */

import { addDays, daysBetween, parseISO, startOfDay, startOfWeek, toISO } from './dates.js';

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function validEntry(entry) {
  return entry && typeof entry.date === 'string' && Number.isFinite(Number(entry.amount));
}

/**
 * computePlan(state, today) -> a complete, read-only snapshot of the plan.
 *
 * state: { startDate, endDate, initialAmount, entries[], reloads[], settings }
 * today: Date (defaults to now). Only the calendar day matters.
 */
export function computePlan(state, today = new Date()) {
  // Weeks always run Saturday → Friday. Saturday is 6 in JS's getDay().
  const weekStartDay = 6;
  const todayDate = startOfDay(today);

  // 1. Money in. The "total balance" is what was entered at onboarding plus
  //    every reload since; reloads are kept as history rather than folding
  //    them into one opaque number.
  const totalBalance =
    num(state?.initialAmount) + (state?.reloads || []).reduce((sum, r) => sum + num(r.amount), 0);

  // 2. Money out. Every dated entry counts once, wherever it falls.
  const entries = (state?.entries || []).filter(validEntry).map((entry) => ({
    ...entry,
    amount: num(entry.amount),
    dateObj: parseISO(entry.date),
  }));
  const totalSpent = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remaining = totalBalance - totalSpent;

  // 3. The week grid. Weeks are calendar weeks aligned to the user's chosen
  //    first day, so "this week" always means the same thing everywhere.
  const currentWeekStart = startOfWeek(todayDate, weekStartDay);
  const planEnd = parseISO(state?.endDate);
  const endWeekStart = startOfWeek(planEnd, weekStartDay);

  let firstWeekStart = startOfWeek(parseISO(state?.startDate), weekStartDay);
  for (const entry of entries) {
    const entryWeekStart = startOfWeek(entry.dateObj, weekStartDay);
    if (entryWeekStart < firstWeekStart) firstWeekStart = entryWeekStart;
  }

  // If the end date has already passed we still need a week to live in, so the
  // timeline runs at least to the current week.
  const lastWeekStart = endWeekStart > currentWeekStart ? endWeekStart : currentWeekStart;

  // Bucket entries by week once (instead of filtering the whole list per week).
  const entriesByWeek = new Map();
  for (const entry of entries) {
    const key = toISO(startOfWeek(entry.dateObj, weekStartDay));
    if (!entriesByWeek.has(key)) entriesByWeek.set(key, []);
    entriesByWeek.get(key).push(entry);
  }

  const weeks = [];
  for (let cursor = firstWeekStart; cursor <= lastWeekStart; cursor = addDays(cursor, 7)) {
    const weekKey = toISO(cursor);
    const weekEnd = addDays(cursor, 6);
    const weekEntries = (entriesByWeek.get(weekKey) || []).sort(
      (a, b) => a.date.localeCompare(b.date) || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    );
    const spent = weekEntries.reduce((sum, entry) => sum + entry.amount, 0);
    weeks.push({
      index: weeks.length,
      start: cursor,
      end: weekEnd,
      startISO: weekKey,
      endISO: toISO(weekEnd),
      entries: weekEntries,
      spent,
      isCurrent: cursor.getTime() === currentWeekStart.getTime(),
      isPast: cursor < currentWeekStart,
      isFuture: cursor > currentWeekStart,
    });
  }

  // 4. Redistribution. A partial last week counts as a whole week, and the
  //    current week is part of the split.
  const weeksLeft = Math.max(1, Math.round(daysBetween(currentWeekStart, lastWeekStart) / 7) + 1);
  const weeklyBudget = remaining / weeksLeft;

  for (const week of weeks) {
    if (week.isPast) {
      // Locked: redistribution never reaches back into a finished week.
      week.budget = week.spent;
      week.left = 0;
    } else {
      week.budget = weeklyBudget;
      week.left = weeklyBudget - week.spent;
    }
  }

  const currentWeek = weeks.find((week) => week.isCurrent) || weeks[weeks.length - 1] || null;

  return {
    totalBalance,
    totalSpent,
    remaining,
    weeks,
    weeksLeft,
    weeklyBudget,
    currentWeek,
    endDate: state?.endDate ?? null,
    endDatePassed: planEnd < todayDate,
    // Clear signal for the UI: the money cannot reach the end date.
    overBudget: weeklyBudget < 0,
    today: todayDate,
  };
}

/**
 * The calendar-week count between two dates, used by the onboarding and reload
 * previews before a plan exists. A partial last week counts as a week.
 */
export function weeksBetween(startISO, endISO, weekStartDay = 6) {
  const start = startOfWeek(parseISO(startISO), weekStartDay);
  const end = startOfWeek(parseISO(endISO), weekStartDay);
  return Math.max(1, Math.round(daysBetween(start, end) / 7) + 1);
}
