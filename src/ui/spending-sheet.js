/** spending-sheet.js — add or edit a spending entry in a bottom sheet. */

import { actions, getState } from '../state.js';
import { isValidISO, toISO } from '../dates.js';
import { currencySymbol, escapeHtml, formatDayYear, formatMoney, parseAmount } from '../utils.js';
import { icon } from './icons.js';
import { guardAmountInput } from './numeric-input.js';
import { openModal, sheetHeading } from './modal.js';
import { toast } from './toast.js';

export function openSpendingSheet(entry = null) {
  const state = getState();
  const currency = state.settings.currency;
  const editing = Boolean(entry);
  const today = toISO(new Date());
  const minDate = state.startDate && state.startDate < today ? state.startDate : today;
  const values = {
    amount: entry ? String(entry.amount) : '',
    note: entry ? entry.note : '',
    date: entry ? entry.date : today,
  };

  openModal({
    html: `
      ${sheetHeading(
        editing ? 'Edit spending' : 'Add spending',
        editing ? 'Change anything — every affected week recalculates on save.' : 'Money out. It counts toward the week of its date.'
      )}
      <form class="form" novalidate>
        <div class="field">
          <label class="field-label" for="sp-amount">Amount</label>
          <div class="money-input money-input--sm">
            <span class="prefix">${escapeHtml(currencySymbol(currency))}</span>
            <input id="sp-amount" name="amount" inputmode="decimal" autocomplete="off" placeholder="0" value="${escapeHtml(
              values.amount
            )}" />
          </div>
          <p class="field-error" data-error="amount"></p>
        </div>
        <div class="field">
          <label class="field-label" for="sp-note">Note <span class="opt">optional</span></label>
          <input class="input" id="sp-note" name="note" maxlength="80" autocomplete="off" placeholder="Lunch, transport, data…" value="${escapeHtml(
            values.note
          )}" />
        </div>
        <div class="field">
          <label class="field-label" for="sp-date">Date</label>
          <input class="input" id="sp-date" name="date" type="date" min="${minDate}" max="${today}" value="${values.date}" />
          <p class="field-error" data-error="date"></p>
        </div>
        <button type="submit" class="sr-only" tabindex="-1" aria-hidden="true">Save</button>
        ${
          editing
            ? `<button type="button" class="btn btn--danger-ghost btn--block delete-btn" data-delete>${icon('trash')} Delete entry</button>`
            : ''
        }
      </form>
      <div class="sheet-actions">
        <button type="button" class="btn btn--ghost" data-cancel>Cancel</button>
        <button type="button" class="btn btn--primary" data-save>${editing ? 'Save changes' : 'Add spending'}</button>
      </div>`,
    onMount(modal) {
      const form = modal.body.querySelector('form');
      const amountInput = modal.body.querySelector('#sp-amount');
      guardAmountInput(amountInput);
      const noteInput = modal.body.querySelector('#sp-note');
      const dateInput = modal.body.querySelector('#sp-date');

      const setError = (field, message) => {
        const node = modal.body.querySelector(`[data-error="${field}"]`);
        if (node) node.textContent = message;
      };

      const submit = () => {
        setError('amount', '');
        setError('date', '');
        const amount = parseAmount(amountInput.value);
        const date = dateInput.value;
        let invalid = false;

        if (!Number.isFinite(amount) || amount <= 0) {
          setError('amount', 'Enter an amount greater than zero.');
          amountInput.focus();
          invalid = true;
        } else if (amount > 1e12) {
          setError('amount', 'That amount is too large.');
          invalid = true;
        }

        if (!isValidISO(date)) {
          setError('date', 'Pick a date for this spending.');
          invalid = true;
        } else if (date > today) {
          setError('date', 'Spending can only be logged for today or earlier.');
          invalid = true;
        } else if (date < minDate) {
          setError('date', `Your plan starts on ${formatDayYear(minDate)}.`);
          invalid = true;
        }

        if (invalid) return;

        const note = noteInput.value.trim();
        if (editing) {
          actions.updateEntry(entry.id, { amount, note, date });
        } else {
          actions.addEntry({ amount, note, date });
        }
        modal.close();
        toast(editing ? 'Entry updated.' : `Added ${formatMoney(amount, currency)} to this week.`, { duration: 2600 });
      };

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submit();
      });
      modal.body.querySelector('[data-save]').addEventListener('click', submit);
      modal.body.querySelector('[data-cancel]').addEventListener('click', modal.close);

      const deleteButton = modal.body.querySelector('[data-delete]');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          modal.close();
          const removed = actions.deleteEntry(entry.id);
          if (!removed) return;
          toast(
            `Deleted ${removed.note ? escapeHtml(removed.note) : 'entry'} · ${formatMoney(removed.amount, currency)}`,
            {
              actionLabel: 'Undo',
              onAction: () => actions.restoreEntry(removed),
              duration: 6500,
            }
          );
        });
      }
    },
  });
}
