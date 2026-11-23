/** dashboard.js — remaining balance, this week's budget and a quick add. */

import { computePlan } from '../calc.js';
import { formatDay, formatDayYear, formatMoney, daysInWeekLeft, plural, weekRange } from '../utils.js';
import { toISO } from '../dates.js';
import { animateMoney, animateProgress } from './fx.js';
import { icon } from './icons.js';
import { entryRow, progressBar } from './parts.js';
import { openSpendingSheet } from './spending-sheet.js';
import { openReloadDialog } from './reload.js';

export function renderDashboard(root, state) {
  const plan = computePlan(state);
  const currency = state.settings.currency;
  const fmt = (value) => formatMoney(value, currency);
  const week = plan.currentWeek || {
    startISO: state.startDate,
    endISO: state.endDate,
    entries: [],
    spent: 0,
    budget: 0,
    left: 0,
  };
  const ratio = week.budget > 0 ? week.spent / week.budget : week.spent > 0 ? 1 : 0;
  const over = week.left < 0;
  const daysLeft = daysInWeekLeft(week.endISO);
  const recent = week.entries.slice(-3).reverse();

  const banners = [];
  if (plan.overBudget) {
    banners.push(`<div class="banner" role="alert">${icon('alert')}<div><strong>This money won't last until ${formatDayYear(
      plan.endDate
    )}.</strong> You're ${fmt(Math.abs(plan.remaining))} over — add money or shorten the plan.</div></div>`);
  } else if (plan.endDatePassed) {
    banners.push(`<div class="banner banner--warn" role="alert">${icon('alert')}<div><strong>Your end date has passed.</strong> Reload to add money and set a new date.</div></div>`);
  }

  root.innerHTML = `<section class="view">
    <div class="dash-top">
      <p class="eyebrow">Dashboard</p>
      <p class="dash-date">${formatDay(toISO(plan.today))}</p>
    </div>

    <div class="hero">
      <div class="hero-top">
        <span class="hero-label">Remaining balance</span>
        <button type="button" class="pill pill--accent" data-reload>${icon('reload')}<span>Reload</span></button>
      </div>
      <div class="hero-amount" data-fx-money="balance" data-value="${plan.remaining}">${fmt(plan.remaining)}</div>
      <div class="hero-until">${icon('flag')}<span>until <strong>${formatDayYear(plan.endDate)}</strong></span></div>
      <div class="hero-stats">
        <div class="hero-stat"><span>${plan.weeksLeft}</span><small>${plural(plan.weeksLeft, 'week left', 'weeks left')}</small></div>
        <span class="hero-divider" aria-hidden="true"></span>
        <div class="hero-stat"><span>${fmt(plan.weeklyBudget)}</span><small>per week</small></div>
      </div>
    </div>

    ${banners.join('')}

    <div class="card week-card">
      <div class="card-head">
        <div>
          <p class="eyebrow">This week</p>
          <h2 class="week-range">${weekRange(week.startISO, week.endISO)}</h2>
        </div>
        <span class="chip">${daysLeft === 0 ? 'Last day' : `${daysLeft} ${plural(daysLeft, 'day', 'days')} left`}</span>
      </div>

      <div class="week-left">
        <p class="label">Left to spend</p>
        <p class="big ${over ? 'is-over' : ''}" data-fx-money="week-left" data-value="${week.left}">${fmt(week.left)}</p>
      </div>

      <div class="split">
        <div><span>Week budget</span><strong>${fmt(week.budget)}</strong></div>
        <div><span>Spent so far</span><strong>${fmt(week.spent)}</strong></div>
      </div>

      ${progressBar(ratio, 'week-progress', over)}
      <div class="progress-meta">
        <span>${Math.round(ratio * 100)}% of budget used</span>
        <span>${over ? `${fmt(Math.abs(week.left))} over budget` : `${fmt(week.left)} still available`}</span>
      </div>

      <button type="button" class="btn btn--primary btn--block week-add" data-add>${icon('plus')} Add spending</button>
    </div>

    <div class="section-head">
      <h2>This week's activity</h2>
      <a class="link-btn" href="#/week">View all</a>
    </div>

    ${
      recent.length
        ? `<div class="card list-card">${recent.map((entry) => entryRow(entry, currency)).join('')}</div>`
        : `<div class="card list-card">${placeholder('Nothing logged yet', 'Your spending for this week will show up here.')}</div>`
    }
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
  root.querySelectorAll('[data-reload]').forEach((button) => {
    button.addEventListener('click', () => openReloadDialog());
  });
  root.querySelectorAll('[data-entry]').forEach((button) => {
    button.addEventListener('click', () => {
      const entry = state.entries.find((candidate) => candidate.id === button.dataset.entry);
      if (entry) openSpendingSheet(entry);
    });
  });
}

function placeholder(title, text) {
  return `<div class="mini-empty"><strong>${title}</strong><span>${text}</span></div>`;
}
