/** weeks.js — the timeline: upcoming budgets on top, locked past weeks below. */

import { computePlan } from '../calc.js';
import { formatMoney, plural, weekRange } from '../utils.js';
import { icon } from './icons.js';
import { progressBar } from './parts.js';
import { animateProgress } from './fx.js';

export function renderWeeks(root, state) {
  const plan = computePlan(state);
  const currency = state.settings.currency;
  const fmt = (value) => formatMoney(value, currency);

  const active = plan.weeks.filter((week) => !week.isPast);
  const past = plan.weeks.filter((week) => week.isPast).reverse();

  const banner = plan.overBudget
    ? `<div class="banner" role="alert">${icon('alert')}<div><strong>The money doesn't reach your end date.</strong> Each remaining week needs ${fmt(
        plan.weeklyBudget
      )}, which is below zero. Reload or move the end date earlier.</div></div>`
    : '';

  const renderRow = (week) => {
    const ratio = week.budget > 0 ? week.spent / week.budget : week.spent > 0 ? 1 : 0;
    const status = week.isCurrent ? 'Now' : week.isPast ? 'Final' : 'Upcoming';
    const modifier = week.isCurrent ? 'is-current' : week.isPast ? 'is-past' : 'is-future';
    const nodeIcon = week.isPast ? icon('lock') : week.isCurrent ? icon('wallet') : '';

    return `<div class="tl-row ${modifier}">
      <span class="tl-node" aria-hidden="true">${nodeIcon}</span>
      <div class="tl-card">
        <div class="tl-top">
          <span class="tl-range">${weekRange(week.startISO, week.endISO)}</span>
          <span class="chip ${week.isCurrent ? 'chip--accent' : week.isPast ? 'chip--muted' : ''}">${
            week.isPast ? `${icon('lock')}${status}` : status
          }</span>
        </div>
        <div class="tl-bottom">
          <span class="tl-amount">${fmt(week.isPast ? week.spent : week.budget)}</span>
          <span class="tl-spent">${week.isPast ? 'final spend' : week.isCurrent ? `of ${fmt(week.budget)} · ${fmt(week.spent)} spent` : `budget · ${fmt(week.spent)} spent`}</span>
        </div>
        ${week.isCurrent ? progressBar(ratio, 'tl-progress', week.left < 0) : ''}
      </div>
    </div>`;
  };

  root.innerHTML = `<section class="view">
    <header class="view-head">
      <p class="eyebrow">The plan</p>
      <h1>Week by week</h1>
      <p class="sub">${fmt(plan.remaining)} left · ${fmt(plan.weeklyBudget)} per week across ${plan.weeksLeft} ${plural(
    plan.weeksLeft,
    'week',
    'weeks'
  )}.</p>
    </header>

    ${banner}

    <h2 class="timeline-title">Now &amp; next</h2>
    <div class="timeline">${active.map(renderRow).join('')}</div>

    ${
      past.length
        ? `<h2 class="timeline-title">Past weeks · locked</h2>
           <div class="timeline">${past.map(renderRow).join('')}</div>`
        : `<p class="foot-hint">Past weeks appear here once this week is over, locked at their final spend.</p>`
    }
  </section>`;

  root.querySelectorAll('[data-fx-progress]').forEach((el) => {
    animateProgress(el, el.dataset.fxProgress, Number(el.dataset.ratio));
  });
}
