/** utils.js — formatting, parsing and small shared helpers. */

import { MS_PER_DAY, parseISO, startOfDay } from './dates.js';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

export const DEFAULT_CURRENCY = 'USD';

export function currencyOf(code) {
  return CURRENCIES.find((currency) => currency.code === code) || CURRENCIES[0];
}

export function currencySymbol(code) {
  return currencyOf(code).symbol;
}

const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Money for display: symbol first, grouped thousands, at most two decimals. */
export function formatMoney(value, code = DEFAULT_CURRENCY) {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(Math.abs(safe) * 100) / 100;
  const negative = safe < -0.004 && rounded !== 0;
  return `${negative ? '-' : ''}${currencySymbol(code)}${numberFormat.format(rounded)}`;
}

/** Unsigned money, e.g. for "spent" figures where the label already carries the meaning. */
export function formatMoneyAbs(value, code = DEFAULT_CURRENCY) {
  return formatMoney(Math.abs(Number(value) || 0), code);
}

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const dayYearFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const shortFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });

export function formatDay(iso) {
  return dayFormat.format(parseISO(iso));
}

export function formatDayYear(iso) {
  return dayYearFormat.format(parseISO(iso));
}

export function formatShort(iso) {
  return shortFormat.format(parseISO(iso));
}

export function dayLabel(iso) {
  const date = parseISO(iso);
  const today = startOfDay(new Date());
  const diff = Math.round((today.getTime() - date.getTime()) / MS_PER_DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return dayFormat.format(date);
}

/** "23–29 Nov" when the range stays in one month, otherwise "28 Nov – 4 Dec". */
export function weekRange(startISO, endISO) {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${shortFormat.format(end).replace(/^\d+\s/, '')}`;
  }
  return `${shortFormat.format(start)} – ${shortFormat.format(end)}`;
}

export function daysInWeekLeft(endISO, today = new Date()) {
  const end = parseISO(endISO);
  return Math.max(0, Math.round((end.getTime() - startOfDay(today).getTime()) / MS_PER_DAY));
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

/** Accepts "1500", "1,500.50", "$1500", " 1 500 ". Returns NaN when unusable. */
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  const cleaned = String(input ?? '')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,/g, '');
  if (!cleaned || !/[0-9]/.test(cleaned)) return NaN;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : NaN;
}

export function plural(count, one, many) {
  return count === 1 ? one : many;
}

export function uid() {
  if (globalThis.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function noteInitial(note) {
  const trimmed = String(note || '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '•';
}

/** Stable pseudo-random tint index so a note keeps the same colour. */
export function tintIndex(seed) {
  const value = String(seed || '');
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997;
  return hash % 6;
}
