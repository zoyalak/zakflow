/** parts.js — markup fragments shared by the views. */

import { escapeHtml, formatDay, formatMoney, noteInitial, tintIndex } from '../utils.js';

export function entryRow(entry, currency, { running = null } = {}) {
  const note = String(entry.note || '').trim();
  const meta = running === null ? formatDay(entry.date) : `Running total ${formatMoney(running, currency)}`;
  return `<button type="button" class="entry" data-entry="${escapeHtml(entry.id)}" aria-label="${escapeHtml(
    `${note || 'Spending'}, ${formatMoney(entry.amount, currency)}`
  )}">
    <span class="entry-badge tint-${tintIndex(note || entry.id)}">${escapeHtml(noteInitial(note))}</span>
    <span class="entry-text">
      <span class="entry-note">${escapeHtml(note || 'Spending')}</span>
      <span class="entry-meta">${escapeHtml(meta)}</span>
    </span>
    <span class="entry-amount">${formatMoney(-entry.amount, currency)}</span>
  </button>`;
}

export function emptyState({ title, text, actionLabel = '', action = '' }) {
  return `<div class="empty">
    <span class="empty-ico">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 17.5 9 12l3.2 3.2L20 6.5"/><path d="M15 6.5h5v5"/>
      </svg>
    </span>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(text)}</p>
    ${actionLabel ? `<button type="button" class="btn btn--soft btn--sm" ${action}>${escapeHtml(actionLabel)}</button>` : ''}
  </div>`;
}

export function progressBar(ratio, key, over) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return `<div class="progress ${over ? 'is-over' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(
    clamped * 100
  )}">
    <div class="progress-fill" data-fx-progress="${key}" data-ratio="${clamped}"></div>
  </div>`;
}
