/**
 * state.js — the single source of truth.
 *
 * UI code never writes storage directly: it calls an action, the action
 * produces the next state, and every subscriber repaints. That keeps
 * "add / edit / delete recalculates instantly" a property of the store rather
 * than something each view has to remember.
 */

import { toISO } from './dates.js';
import { clearState, emptyState, loadState, normalize, saveState } from './storage.js';
import { uid } from './utils.js';

let state = loadState() || emptyState();
const listeners = new Set();
let saveErrorHandler = null;

export function onSaveError(handler) {
  saveErrorHandler = handler;
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener(state));
}

function commit(next) {
  state = next;
  try {
    saveState(state);
  } catch (error) {
    console.error('[zakflow] could not save state', error);
    if (saveErrorHandler) saveErrorHandler(error);
  }
  emit();
}

/** Pick up changes made in another tab/window of the same app. */
export function syncFromStorage() {
  const next = loadState();
  if (!next) return;
  state = next;
  emit();
}

export const actions = {
  onboard({ amount, endDate }) {
    commit({
      ...state,
      onboarded: true,
      startDate: toISO(new Date()),
      endDate,
      initialAmount: Math.round(amount * 100) / 100,
      entries: [],
      reloads: [],
    });
  },

  addEntry({ amount, note = '', date }) {
    const entry = {
      id: uid(),
      amount: Math.round(amount * 100) / 100,
      note: note.slice(0, 120),
      date,
      createdAt: new Date().toISOString(),
    };
    commit({ ...state, entries: [...state.entries, entry] });
    return entry;
  },

  updateEntry(id, patch) {
    commit({
      ...state,
      entries: state.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...patch,
              amount: Math.round(Number(patch.amount ?? entry.amount) * 100) / 100,
              note: String(patch.note ?? entry.note).slice(0, 120),
            }
          : entry
      ),
    });
  },

  deleteEntry(id) {
    const entry = state.entries.find((candidate) => candidate.id === id) || null;
    if (!entry) return null;
    commit({ ...state, entries: state.entries.filter((candidate) => candidate.id !== id) });
    return entry;
  },

  restoreEntry(entry) {
    if (!entry || state.entries.some((candidate) => candidate.id === entry.id)) return;
    commit({ ...state, entries: [...state.entries, entry] });
  },

  addReload({ amount, endDate }) {
    const reload = {
      id: uid(),
      amount: Math.round(amount * 100) / 100,
      date: toISO(new Date()),
      createdAt: new Date().toISOString(),
    };
    commit({
      ...state,
      reloads: [...state.reloads, reload],
      endDate,
    });
    return reload;
  },

  updateSettings(patch) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },

  replaceAll(candidate) {
    const next = normalize(candidate);
    next.onboarded = true;
    commit(next);
  },

  resetAll() {
    clearState();
    commit(emptyState());
  },
};
