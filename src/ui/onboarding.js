/** onboarding.js — first launch: the balance, then the finish line. */

import { computePlan } from '../calc.js';
import { addDays, addMonths, toISO } from '../dates.js';
import { actions, getState } from '../state.js';
import {
  currencySymbol,
  escapeHtml,
  formatDayYear,
  formatMoney,
  parseAmount,
  plural,
} from '../utils.js';
import { brandMark, icon } from './icons.js';
import { guardAmountInput } from './numeric-input.js';

export function renderOnboarding(appDiv) {
  const state = getState();
  const currency = state.settings.currency;
  const symbol = currencySymbol(currency);
  const fmt = (value) => formatMoney(value, currency);
  const todayISO = toISO(new Date());
  const minEnd = toISO(addDays(new Date(), 1));

  const draft = { amount: '', endDate: toISO(addMonths(new Date(), 1)) };
  let step = 1;

  appDiv.innerHTML = '<div class="onboarding"></div>';
  const root = appDiv.querySelector('.onboarding');

  function budgetPreview() {
    const amount = parseAmount(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !draft.endDate) return '';
    const plan = computePlan(
      {
        startDate: todayISO,
        endDate: draft.endDate,
        initialAmount: amount,
        entries: [],
        reloads: [],
        settings: state.settings,
      },
      new Date()
    );
    return `<div class="ob-preview">
      <span class="ob-preview-label">Your weekly budget</span>
      <strong class="ob-preview-value">${fmt(plan.weeklyBudget)}</strong>
      <span class="ob-preview-meta">${plan.weeksLeft} ${plural(
      plan.weeksLeft,
      'week',
      'weeks'
    )} · ends ${formatDayYear(draft.endDate)}</span>
      ${
        plan.weeksLeft === 1
          ? '<span class="ob-preview-note">Less than a week to go — the whole amount covers this week.</span>'
          : ''
      }
    </div>`;
  }

  function draw() {
    if (step === 1) {
      root.innerHTML = `<header class="ob-top">
        <span class="brand">${brandMark(28)}<span>ZakFlow</span></span>
        <div class="ob-dots" aria-hidden="true"><i class="is-on"></i><i></i></div>
      </header>
      <div class="ob-main">
        <h1 class="ob-title ob-title--welcome">Welcome to ZakFlow! Feed me your balance and I&rsquo;ll make it last</h1>
        <p class="ob-sub">We'll split it evenly across the weeks ahead, then rebalance as you spend.</p>
        <form class="form" novalidate>
          <div class="money-input money-input--lg">
            <span class="prefix">${escapeHtml(symbol)}</span>
            <input id="ob-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="${escapeHtml(
              draft.amount
            )}" aria-label="Amount of money you have" />
          </div>
          <p class="field-error" data-error="amount"></p>
        </form>
        <p class="ob-note">${icon('lock')} Stored only on this device.</p>
      </div>
      <div class="ob-foot">
        <button type="button" class="btn btn--primary btn--block" data-next>Continue</button>
      </div>`;

      const input = root.querySelector('#ob-amount');
      guardAmountInput(input);
      root.querySelector('[data-next]').addEventListener('click', () => {
        const amount = parseAmount(input.value);
        const error = root.querySelector('[data-error="amount"]');
        if (!Number.isFinite(amount) || amount <= 0) {
          error.textContent = 'Enter an amount greater than zero.';
          input.focus();
          return;
        }
        if (amount > 1e12) {
          error.textContent = 'That amount is too large.';
          return;
        }
        draft.amount = input.value;
        step = 2;
        draw();
      });
      input.addEventListener('input', () => {
        const error = root.querySelector('[data-error="amount"]');
        if (error) error.textContent = '';
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          root.querySelector('[data-next]').click();
        }
      });
      setTimeout(() => input.focus({ preventScroll: true }), 220);
      return;
    }

    root.innerHTML = `<header class="ob-top">
      <button type="button" class="icon-btn" data-back aria-label="Back">${icon('chevronLeft')}</button>
      <div class="ob-dots" aria-hidden="true"><i class="is-on"></i><i class="is-on"></i></div>
    </header>
    <div class="ob-main">
      <h1 class="ob-title">Lovely! When do you need this to last until?</h1>
      <p class="ob-sub">Pick the last day this money needs to cover. A partial week still counts as a week.</p>
      <form class="form" novalidate>
        <div class="field">
          <label class="field-label" for="ob-end">End date</label>
          <input class="input input--date" id="ob-end" type="date" min="${minEnd}" value="${draft.endDate}" />
          <p class="field-error" data-error="date"></p>
        </div>
      </form>
      <div class="chips" style="margin-top:12px">
        <button type="button" class="chip chip--button" data-months="1">1 month</button>
        <button type="button" class="chip chip--button" data-months="2">2 months</button>
        <button type="button" class="chip chip--button" data-months="3">3 months</button>
      </div>
      <div data-preview>${budgetPreview()}</div>
      <p class="ob-note">${icon('lock')} You can change this later with Reload.</p>
    </div>
    <div class="ob-foot">
      <button type="button" class="btn btn--primary btn--block" data-finish>Start tracking</button>
    </div>`;

    const dateInput = root.querySelector('#ob-end');
    const error = root.querySelector('[data-error="date"]');
    const preview = root.querySelector('[data-preview]');

    const refresh = () => {
      draft.endDate = dateInput.value;
      error.textContent = '';
      preview.innerHTML = budgetPreview();
    };

    dateInput.addEventListener('change', refresh);
    dateInput.addEventListener('input', refresh);

    root.querySelectorAll('[data-months]').forEach((button) => {
      button.addEventListener('click', () => {
        dateInput.value = toISO(addMonths(new Date(), Number(button.dataset.months)));
        refresh();
      });
    });

    root.querySelector('[data-back]').addEventListener('click', () => {
      draft.endDate = dateInput.value || draft.endDate;
      step = 1;
      draw();
    });

    root.querySelector('[data-finish]').addEventListener('click', () => {
      const amount = parseAmount(draft.amount);
      const endDate = dateInput.value;
      if (!endDate || endDate < minEnd) {
        error.textContent = 'Choose a future date — tomorrow or later.';
        dateInput.focus();
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        step = 1;
        draw();
        return;
      }
      actions.onboard({ amount, endDate });
    });

    // Show the week count immediately when the screen opens.
    refresh();
  }

  draw();
}
