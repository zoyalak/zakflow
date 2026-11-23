/** week.js — this week's entries with a running total, edit and delete. */

import { computePlan } from '../calc.js';
import { formatDay, formatMoney, dayLabel, plural } from '../utils.js';
import { animateMoney, animateProgress } from './fx.js';
import { icon } from './icons.js';
import { entryRow, progressBar } from './parts.js';
import { openSpendingSheet } from './spending-sheet.js';

export function renderWeek(root, state) {
  const plan = computePlan(state);
  const currency = state.settings.currency;
  const fmt = (value) => formatMoney(value, currency);
  const week = plan.currentWeek;

  if (!week) {
    root.innerHTML = `<section class="view"><div class="card"><p>No plan yet.</p></div></section>`;
    return;
  }

  const ratio = week.budget > 0 ? week.spent / week.budget : week.spent > 0 ? 1 : 0;
  const over = week.left < 0;

  // Running total follows chronological order; the list below groups by day.
  let running = 0;
  const runningById = new Map();
  const groups = new Map();
  for (const entry of week.entries) {
    running += entry.amount;
    runningById.set(entry.id, running);
    if (!groups.has(entry.date)) groups.set(entry.date, []);
    groups.get(entry.date).push(entry);
  }

  const groupMarkup = [...groups.entries()]
    .map(([date, entries]) => {
      const dayTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
      return `<div class="day-group">
        <div class="day-head">
          <span>${dayLabel(date)}</span>
          <span class="day-total">${fmt(dayTotal)}</span>
        </div>
        <div class="day-list">
          ${entries.map((entry) => entryRow(entry, currency, { running: runningById.get(entry.id) })).join('')}
        </div>
      </div>`;
    })
    .join('');

  root.innerHTML = `<section class="view">
    <header class="view-head">
      <p class="eyebrow">This week</p>
      <h1>${formatDay(week.startISO)}</h1>
      <p class="sub">to ${formatDay(week.endISO)}</p>
    </header>

    <div class="card summary">
      <div class="summary-top">
        <div>
          <p class="label">Spent this week</p>
          <p class="big" data-fx-money="week-spent" data-value="${week.spent}">${fmt(week.spent)}</p>
        </div>
        <div class="summary-side">
          <span class="chip ${over ? 'chip--warn' : 'chip--accent'}">${
            over ? `${fmt(Math.abs(week.left))} over` : `${fmt(week.left)} left`
          }</span>
          <span class="chip chip--muted">${fmt(week.budget)} budget</span>
        </div>
      </div>
      ${progressBar(ratio, 'week-view-progress', over)}
      <div class="progress-meta">
        <span>${Math.round(ratio * 100)}% used</span>
        <span>${week.entries.length} ${plural(week.entries.length, 'entry', 'entries')}</span>
      </div>
    </div>

    <div class="section-head">
      <h2>Entries</h2>
      <button type="button" class="link-btn" data-add>${icon('plus')} Add spending</button>
    </div>

    ${
      week.entries.length
        ? groupMarkup
        : `<div class="card empty">
            <span class="empty-ico">${icon('wallet')}</span>
            <h3>Nothing logged yet</h3>
            <p>Every entry you add lands in the week of its date and rebalances the weeks ahead.</p>
            <button type="button" class="btn btn--soft btn--sm" data-add>Add your first entry</button>
          </div>`
    }

    <p class="foot-hint">Tap an entry to edit or delete it.</p>
  </section>`;

  root.querySelectorAll('[data-fx-money]').forEach((el) => {
    animateMoney(el, el.dataset.fxMoney, Number(el.dataset.value), fmt);
  });
  root.querySelectorAll('[data-fx-progress]').forEach((el) => {
    animateProgress(el, el.dataset.fxProgress, Number(el.dataset.ratio));
  });

  root.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => openSpendingSheet());
  });
  root.querySelectorAll('[data-entry]').forEach((button) => {
    button.addEventListener('click', () => {
      const entry = state.entries.find((candidate) => candidate.id === button.dataset.entry);
      if (entry) openSpendingSheet(entry);
    });
  });
}
