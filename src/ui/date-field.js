/** date-field.js — an app-drawn face over the native date input.
 *
 * Native date inputs (especially on iOS) carry their own intrinsic width and
 * can push past their column. The real input stays on top and invisible, so
 * taps still open the platform picker, while the visible box is ours and always
 * fits the layout.
 */

import { formatDayYear } from '../utils.js';
import { icon } from './icons.js';

export function setupDateField(input) {
  if (!input || input.dataset.dateField === 'on') return input;
  input.dataset.dateField = 'on';

  const wrap = document.createElement('div');
  wrap.className = 'date-field';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const face = document.createElement('div');
  face.className = 'date-field-face';
  face.innerHTML = `<span class="date-field-value" data-date-value></span>${icon('calendar')}`;
  wrap.appendChild(face);

  const value = face.querySelector('[data-date-value]');

  const sync = () => {
    value.textContent = input.value ? formatDayYear(input.value) : 'Choose a date';
    value.classList.toggle('is-empty', !input.value);
  };

  input.addEventListener('input', sync);
  input.addEventListener('change', sync);
  input.addEventListener('blur', sync);

  input.addEventListener('click', () => {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        /* Some browsers only allow this from a direct tap — the input still works. */
      }
    }
  });

  sync();
  return input;
}
