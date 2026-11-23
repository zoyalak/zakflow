/**
 * storage.js — everything that touches localStorage.
 *
 * Two keys are kept (the names predate the ZakFlow rename and stay so existing
 * plans keep loading):
 *   pace.state.v1      the current data
 *   pace.state.safety  the last good snapshot, used if the primary copy is
 *                      unreadable (corrupt JSON, interrupted experiment, ...)
 *
 * Updating the app never clears these keys: the data lives in the browser, not
 * in the bundle, so a new version reads the same state. The `version` field and
 * migrate() give future schema changes somewhere to happen without data loss.
 */

import { addDays, isValidISO, parseISO, toISO } from './dates.js';
import { CURRENCIES, DEFAULT_CURRENCY, systemTheme, uid } from './utils.js';

export const STORAGE_KEY = 'pace.state.v1';
export const SAFETY_KEY = 'pace.state.safety';
export const SCHEMA_VERSION = 1;

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    startDate: null,
    endDate: null,
    initialAmount: 0,
    entries: [],
    reloads: [],
    settings: { currency: DEFAULT_CURRENCY, weekStartDay: 6, theme: systemTheme() },
  };
}

function normalizeAmount(value) {
  const amount = Math.round(Number(value) * 100) / 100;
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function normalizeSpend(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const amount = normalizeAmount(raw.amount);
  if (!amount || !isValidISO(raw.date)) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    amount,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 120) : '',
    date: raw.date,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

function normalizeReload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const amount = normalizeAmount(raw.amount);
  if (!amount) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    amount,
    date: isValidISO(raw.date) ? raw.date : toISO(new Date()),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
  };
}

/** Bring older schemas forward. Each step is additive so no data is dropped. */
function migrate(raw) {
  let data = raw;
  const version = Number(data.version) || 0;

  if (version < 1) {
    // Pre-versioned shape used `balance` / `spendings`. Accept it so an early
    // backup still imports cleanly.
    data = {
      ...data,
      initialAmount: data.initialAmount ?? data.balance ?? 0,
      entries: Array.isArray(data.entries) ? data.entries : Array.isArray(data.spendings) ? data.spendings : [],
      reloads: Array.isArray(data.reloads) ? data.reloads : [],
      settings: {
        currency: data.currency ?? data.settings?.currency,
        weekStartDay: data.weekStartDay ?? data.settings?.weekStartDay,
        theme: data.theme ?? data.settings?.theme,
      },
    };
  }

  return data;
}

/** Merge unknown input with the defaults and repair anything unusable. */
export function normalize(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;

  const data = migrate(raw);
  const state = {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings && typeof data.settings === 'object' ? data.settings : {}) },
  };

  state.version = SCHEMA_VERSION;
  state.onboarded = data.onboarded === true;
  state.entries = Array.isArray(data.entries) ? data.entries.map(normalizeSpend).filter(Boolean) : [];
  state.reloads = Array.isArray(data.reloads) ? data.reloads.map(normalizeReload).filter(Boolean) : [];
  state.initialAmount = normalizeAmount(data.initialAmount);

  if (!CURRENCIES.some((currency) => currency.code === state.settings.currency)) {
    state.settings.currency = DEFAULT_CURRENCY;
  }
  // Weeks are always Saturday → Friday.
  state.settings.weekStartDay = 6;
  state.settings.theme = state.settings.theme === 'light' ? 'light' : state.settings.theme === 'dark' ? 'dark' : systemTheme();

  // Repair dates rather than throwing data away.
  if (!isValidISO(state.startDate)) {
    const earliest = state.entries.map((entry) => entry.date).sort()[0];
    state.startDate = earliest || toISO(new Date());
  }
  if (!isValidISO(state.endDate) || parseISO(state.endDate) <= parseISO(state.startDate)) {
    state.endDate = toISO(addDays(parseISO(state.startDate), 28));
  }

  if (!state.onboarded && (state.initialAmount > 0 || state.entries.length > 0)) {
    // A backup that lost its flag but clearly holds a plan is still a plan.
    state.onboarded = true;
  }

  return state;
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`[zakflow] could not read ${key}`, error);
    return null;
  }
}

export function loadState() {
  const primary = readJSON(STORAGE_KEY);
  if (primary) return normalize(primary);
  const safety = readJSON(SAFETY_KEY);
  if (safety) {
    console.warn('[zakflow] restored the last good snapshot');
    return normalize(safety);
  }
  return null;
}

export function saveState(state) {
  const json = JSON.stringify(state);
  const previous = localStorage.getItem(STORAGE_KEY);
  if (previous && previous !== json) {
    try {
      localStorage.setItem(SAFETY_KEY, previous);
    } catch (error) {
      /* the safety copy is a nicety, never block a real save on it */
    }
  }
  localStorage.setItem(STORAGE_KEY, json);
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SAFETY_KEY);
}

/** Backup payload shared by export and import. */
export function buildBackup(state) {
  return {
    app: 'zakflow',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

/** Accepts either a raw state or a wrapped backup file. Returns normalized state. */
export function readBackup(text) {
  const parsed = JSON.parse(text);
  const candidate = parsed && parsed.state ? parsed.state : parsed;
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.entries)) {
    throw new Error('This file does not look like a ZakFlow backup.');
  }
  return normalize(candidate);
}
