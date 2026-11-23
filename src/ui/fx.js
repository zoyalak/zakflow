/** fx.js — small animation helpers for money values and progress bars. */

import { prefersReducedMotion } from '../utils.js';

const moneyMemory = new Map();
const progressMemory = new Map();

/**
 * Counting up/down from the previous value makes "everything recalculates"
 * visible instead of jarring. Memory is keyed by a stable string so it survives
 * the element being re-rendered.
 */
export function animateMoney(el, key, value, format) {
  if (!el) return;
  const target = Number(value) || 0;
  const previous = moneyMemory.has(key) ? moneyMemory.get(key) : target;
  moneyMemory.set(key, target);

  if (prefersReducedMotion() || previous === target) {
    el.textContent = format(target);
    return;
  }

  const start = performance.now();
  const duration = 520;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(previous + (target - previous) * eased);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = format(target);
      el.classList.add('fx-pop');
      setTimeout(() => el.classList.remove('fx-pop'), 420);
    }
  };
  requestAnimationFrame(step);
}

/** Grow the bar from wherever it was last time. */
export function animateProgress(el, key, ratio) {
  if (!el) return;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const previous = progressMemory.has(key) ? progressMemory.get(key) : 0;
  progressMemory.set(key, clamped);

  if (prefersReducedMotion()) {
    el.style.transform = `scaleX(${clamped})`;
    return;
  }

  el.style.transform = `scaleX(${previous})`;
  requestAnimationFrame(() => {
    el.style.transform = `scaleX(${clamped})`;
  });
}
