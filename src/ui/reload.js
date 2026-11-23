/** reload.js — add money now, then re-divide everything from today. */

import { computePlan } from '../calc.js';
import { addDays, isValidISO, toISO } from '../dates.js';
import { actions, getState } from '../state.js';
import { currencySymbol, escapeHtml, formatDayYear, formatMoney, parseAmount, plural } from '../utils.js';
import { icon } from './icons.js';
import { guardAmountInput } from './numeric-input.js';
import { openModal, sheetHeading } from './modal.js';
import { toast } from './toast.js';

export function openReloadDialog() {
  const state = getState();
  const currency = state.settings.currency;
  const symbol = currencySymbol(currency);
  const fmt = (value) => formatMoney(value, currency);
  const today = toISO(new Date());
  const minEnd = toISO(addDays(new Date(), 1));
  const plan = computePlan(state);

  const draft = { amount: '', endDate: state.endDate && state.endDate > today ? state.endDate : minEnd };
  let step = 1;
  let modal = null;

  function finish() {
    const amount = parseAmount(draft.amount);
    const dateInput = modal.body.querySelector('#rl-end');
    const endDate = dateInput ? dateInput.value : draft.endDate;
    const error = modal.body.querySelector('[data-error="date"]');

    if (!isValidISO(endDate) || endDate <= today) {
      if (error) error.textContent = 'Pick a date after today.';
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      step = 1;
      draw();
      return;
    }

    actions.addReload({ amount, endDate });
    modal.close();
    const nextPlan = computePlan(getState());
    toast(`Added ${fmt(amount)} · ${fmt(nextPlan.weeklyBudget)} per week from now.`, { duration: 4200 });
  }

  function draw() {
    if (step === 1) {
      modal.body.innerHTML = `
        ${sheetHeading('Reload', 'Add money to what you have left.')}
        <div class="info-row">
          <span>Remaining now</span>
          <strong>${fmt(plan.remaining)}</strong>
        </div>
        <form class="form" novalidate>
          <div class="field">
            <label class="field-label" for="rl-amount">How much money do you want to add?</label>
            <div class="money-input money-input--sm">
              <span class="prefix">${escapeHtml(symbol)}</span>
              <input id="rl-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="${escapeHtml(
                draft.amount
              )}" />
            </div>
            <p class="field-error" data-error="amount"></p>
          </div>
        </form>
        <div class="sheet-actions">
          <button type="button" class="btn btn--ghost" data-cancel>Cancel</button>
          <button type="button" class="btn btn--primary" data-next>Continue</button>
        </div>`;

      const amountInput = modal.body.querySelector('#rl-amount');
      guardAmountInput(amountInput);
      const next = () => {
        const amount = parseAmount(amountInput.value);
        const error = modal.body.querySelector('[data-error="amount"]');
        if (!Number.isFinite(amount) || amount <= 0) {
          if (error) error.textContent = 'Enter an amount greater than zero.';
          amountInput.focus();
          return;
        }
        draft.amount = amountInput.value;
        step = 2;
        draw();
      };
      modal.body.querySelector('[data-cancel]').addEventListener('click', modal.close);
      modal.body.querySelector('[data-next]').addEventListener('click', next);
      amountInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          next();
        }
      });
      setTimeout(() => amountInput.focus({ preventScroll: true }), 60);
      return;
    }

    // Step 2 — how long the new balance must last.
    const amount = parseAmount(draft.amount) || 0;
    const projected = computePlan(
      {
        ...state,
        reloads: [...state.reloads, { id: 'preview', amount, date: today }],
        endDate: draft.endDate,
      },
      new Date()
    );

    modal.body.innerHTML = `
      ${sheetHeading('Until when should it last?', 'The whole division restarts from today. Past spending stays put.')}
      <div class="info-row">
        <span>Balance after reload</span>
        <strong>${fmt(plan.remaining + amount)}</strong>
      </div>
      <form class="form" novalidate>
        <div class="field">
          <label class="field-label" for="rl-end">End date</label>
          <input class="input" id="rl-end" type="date" min="${minEnd}" value="${draft.endDate}" />
          <p class="field-error" data-error="date"></p>
        </div>
        <div class="ob-preview ob-preview--compact" data-preview>
          <span class="ob-preview-label">New weekly budget</span>
          <strong class="ob-preview-value">${fmt(projected.weeklyBudget)}</strong>
          <span class="ob-preview-meta">${projected.weeksLeft} ${plural(
      projected.weeksLeft,
      'week',
      'weeks'
    )} · ends ${formatDayYear(draft.endDate)}</span>
        </div>
      </form>
      <div class="sheet-actions">
        <button type="button" class="btn btn--ghost" data-back>Back</button>
        <button type="button" class="btn btn--primary" data-confirm>${icon('check')} Reload</button>
      </div>`;

    const dateInput = modal.body.querySelector('#rl-end');
    const preview = modal.body.querySelector('[data-preview]');

    const updatePreview = () => {
      draft.endDate = dateInput.value;
      if (!isValidISO(draft.endDate) || draft.endDate <= today) return;
      const next = computePlan(
        {
          ...state,
          reloads: [...state.reloads, { id: 'preview', amount, date: today }],
          endDate: draft.endDate,
        },
        new Date()
      );
      preview.innerHTML = `<span class="ob-preview-label">New weekly budget</span>
        <strong class="ob-preview-value">${fmt(next.weeklyBudget)}</strong>
        <span class="ob-preview-meta">${next.weeksLeft} ${plural(next.weeksLeft, 'week', 'weeks')} · ends ${formatDayYear(
        draft.endDate
      )}</span>`;
      const error = modal.body.querySelector('[data-error="date"]');
      if (error) error.textContent = '';
    };

    dateInput.addEventListener('change', updatePreview);
    modal.body.querySelector('[data-back]').addEventListener('click', () => {
      draft.endDate = dateInput.value || draft.endDate;
      step = 1;
      draw();
    });
    modal.body.querySelector('[data-confirm]').addEventListener('click', finish);
  }

  modal = openModal({ html: '', onMount: () => {} });
  draw();
}
