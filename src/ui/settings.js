/** settings.js — currency, week start, appearance, backup and reset. */

import { toISO } from '../dates.js';
import { actions } from '../state.js';
import { buildBackup, readBackup } from '../storage.js';
import { CURRENCIES, escapeHtml, formatMoney } from '../utils.js';
import { icon } from './icons.js';
import { confirmDialog } from './modal.js';
import { toast } from './toast.js';

export function renderSettings(root, state) {
  const currency = state.settings.currency;
  const isDark = state.settings.theme === 'dark';

  root.innerHTML = `<section class="view">
    <header class="view-head">
      <p class="eyebrow">Preferences</p>
      <h1>Settings</h1>
      <p class="sub">Everything is stored on this device. No account, no server.</p>
    </header>

    <div class="card">
      <h2 class="card-title">Currency</h2>
      <p class="card-sub">Shown throughout the app.</p>
      <div class="field">
        <label class="field-label" for="set-currency">Symbol &amp; currency</label>
        <select class="select" id="set-currency">
          ${CURRENCIES.map(
            (item) =>
              `<option value="${item.code}" ${item.code === currency ? 'selected' : ''}>${escapeHtml(
                `${item.symbol} — ${item.name} (${item.code})`
              )}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <div class="card row-card">
      <div>
        <h2 class="card-title">Dark mode</h2>
        <p class="card-sub">Comfortable at night, sharp in daylight.</p>
      </div>
      <button type="button" class="switch" data-theme-switch role="switch" aria-checked="${isDark}" aria-label="Dark mode">
        <span></span>
      </button>
    </div>

    <div class="card">
      <h2 class="card-title">Backup</h2>
      <p class="card-sub">Your data survives app updates because it lives in this browser's storage. A JSON backup moves it to a new device or keeps a second copy.</p>
      <div class="data-actions">
        <button type="button" class="btn btn--soft" data-export>${icon('download')} Export JSON backup</button>
        <button type="button" class="btn btn--soft" data-import>${icon('upload')} Import from backup</button>
        <input type="file" accept="application/json,.json" class="sr-only" id="set-import-file" tabindex="-1" />
      </div>
    </div>

    <div class="card card--danger">
      <h2 class="card-title">Reset everything</h2>
      <p class="card-sub">Deletes your balance, entries, reloads and settings from this device.</p>
      <button type="button" class="btn btn--danger-ghost btn--block" data-reset style="margin-top:14px">${icon('trash')} Reset all data</button>
    </div>

    <p class="app-foot">${icon('lock')} ZakFlow v1.0 · stored on this device</p>
  </section>`;

  root.querySelector('#set-currency').addEventListener('change', (event) => {
    actions.updateSettings({ currency: event.target.value });
  });

  root.querySelector('[data-theme-switch]').addEventListener('click', () => {
    document.documentElement.classList.add('theme-fade');
    actions.updateSettings({ theme: isDark ? 'light' : 'dark' });
    setTimeout(() => document.documentElement.classList.remove('theme-fade'), 320);
  });

  root.querySelector('[data-export]').addEventListener('click', () => {
    const payload = JSON.stringify(buildBackup(state), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zakflow-backup-${toISO(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Backup downloaded.');
  });

  const fileInput = root.querySelector('#set-import-file');
  root.querySelector('[data-import]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const imported = readBackup(await file.text());
      fileInput.value = '';
      confirmDialog({
        title: 'Replace your data?',
        message: `This backup holds ${imported.entries.length} ${imported.entries.length === 1 ? 'entry' : 'entries'} and a balance of ${formatMoney(
          imported.initialAmount + imported.reloads.reduce((sum, reload) => sum + reload.amount, 0),
          imported.settings.currency
        )}. Restoring it replaces everything currently on this device.`,
        confirmLabel: 'Restore backup',
        danger: true,
        onConfirm: () => {
          actions.replaceAll(imported);
          toast('Backup restored.');
        },
      });
    } catch (error) {
      console.warn('[zakflow] import failed', error);
      toast('That file could not be read as a ZakFlow backup.');
      fileInput.value = '';
    }
  });

  root.querySelector('[data-reset]').addEventListener('click', () => {
    confirmDialog({
      title: 'Reset everything?',
      message:
        'This removes your balance, every spending entry, reload history and settings from this device. There is no undo — export a backup first if you might want this data back.',
      confirmLabel: 'Reset all data',
      cancelLabel: 'Keep my data',
      danger: true,
      onConfirm: () => actions.resetAll(),
    });
  });
}
